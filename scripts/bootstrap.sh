#!/usr/bin/env bash
#
# One-time bootstrap for satisfactories: provision this app's infrastructure and
# wire the CI <-> infra handoff. Safe to re-run — Terraform is idempotent and
# the GitHub variables are simply overwritten with the latest values.
#
# Prerequisites: terraform, aws (authenticated), gh (authenticated).

set -euo pipefail

AWS_REGION="us-west-2"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/terraform"

echo "==> Checking prerequisites"
for tool in terraform aws gh; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: '$tool' is required but not installed." >&2
    exit 1
  fi
done

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: AWS credentials not configured. Run 'aws sso login' (or configure keys)." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI not authenticated. Run 'gh auth login'." >&2
  exit 1
fi

echo "==> terraform init"
terraform init -input=false

echo "==> terraform plan"
terraform plan -input=false -out=tfplan

cat <<'NOTE'

------------------------------------------------------------------------------
Review the plan above. It should CREATE this app's resources only:
  - S3 content bucket (+ policy)
  - CloudFront distribution (+ OAC, function)
  - Route53 A/AAAA records for the app's domain
  - GitHub Actions OIDC deploy role + scoped policies
  - (if API enabled) Lambda, HTTP API Gateway, optional DynamoDB

It must NOT modify or destroy the shared hosted zone, the ACM certificate, or
the WAF Web ACL. If you see changes to any of those, STOP and investigate.
------------------------------------------------------------------------------

NOTE

read -r -p "Apply this plan? Type 'yes' to continue: " answer
if [ "$answer" != "yes" ]; then
  echo "Aborted. No changes applied."
  rm -f tfplan
  exit 1
fi

echo "==> terraform apply"
terraform apply -input=false tfplan
rm -f tfplan

echo "==> Wiring CI variables via gh"
role_arn="$(terraform output -raw role_arn)"
bucket="$(terraform output -raw bucket_name)"
dist="$(terraform output -raw distribution_id)"
site_url="$(terraform output -raw site_url)"

gh variable set AWS_DEPLOY_ROLE_ARN --body "$role_arn"
gh variable set AWS_REGION --body "$AWS_REGION"
gh variable set S3_BUCKET --body "$bucket"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --body "$dist"

# Lambda name only exists when the API add-on is enabled; the output is null
# otherwise, which makes `terraform output -raw` exit non-zero — tolerate that.
lambda_name="$(terraform output -raw lambda_function_name 2>/dev/null || true)"
if [ -n "${lambda_name:-}" ] && [ "$lambda_name" != "null" ]; then
  gh variable set LAMBDA_FUNCTION_NAME --body "$lambda_name"
  echo "    set LAMBDA_FUNCTION_NAME=$lambda_name"
fi

cat <<DONE

==============================================================================
 Bootstrap complete.

 Site URL (live after first deploy): $site_url

 CI variables set on this repo:
   AWS_DEPLOY_ROLE_ARN, AWS_REGION, S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID${lambda_name:+, LAMBDA_FUNCTION_NAME}

 Next: commit the generated files and push to the default branch to trigger
 the first deploy:

   git add terraform .github/workflows scripts
   git commit -m "chore: add production deploy apparatus"
   git push
==============================================================================

DONE
