# Satisfactories

Plan Satisfactory factories on a world map. Connect production lines and
factories, then track production rates, estimated power, and resource balances.

Live at [satisfactories.robmclaughl.in](https://satisfactories.robmclaughl.in).

## Features

- **Map** — factories as draggable pins on a zoomable world map, with animated
  route lines between them and a context sidebar (world overview, factory
  detail, or route flow depending on what you hover).
- **Factories** — plan named production lines by category, set recipes and
  machine counts, and see power and resource balances. See
  [production lines and allocations](docs/production-lines.md) for the setup
  workflow and how shortages affect delivery.
- **Resources** — world totals for production and consumption, with favorites
  and per-item producer and consumer drill-downs.
- **Reference** — a wiki of items, recipes, and machines.
- **Worlds** — multiple saves, each with its own map.

From **Worlds**, choose **Load sample world** to explore Northern Stretch.
Worlds and favorites are stored in your browser. Use **Save backup** to export
them to JSON. **Load backup** replaces all worlds and favorites in that browser.
See [save compatibility](docs/production-lines.md#save-compatibility) for older
backups.

## Development

```bash
npm ci
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build to dist/
npm test         # production, logistics, and persistence regression checks
```

Built with React 18, Vite, and TypeScript. Use Node 20 to match CI.

See the [maintainer guide](docs/maintainer-guide.md) for the code map and
manual smoke checks, or [AGENTS.md](AGENTS.md) for a quick contributor handoff.

## Deployment

Hosting is provisioned by `terraform/` (S3 + CloudFront on the shared
robmclaughl.in infrastructure) and deployed by `.github/workflows/deploy.yml`
on push to `main`. One-time setup: `scripts/bootstrap.sh`.
