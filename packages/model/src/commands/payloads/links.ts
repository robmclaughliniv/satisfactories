import { z } from 'zod';
import { LinkEndpointSchema, LinkMediumSchema } from '../../decisions/tables';
import { PerMinSchema } from '../../units';

export const ConfirmLinkPayloadSchema = z.object({
  id: z.string(),
  suggestion_fingerprint: z.string(),
  from: LinkEndpointSchema,
  to: LinkEndpointSchema,
  item_short: z.string(),
  medium: LinkMediumSchema,
  via_vehicle_key: z.string().nullable(),
  rate_override: PerMinSchema.nullable(),
});
export type ConfirmLinkPayload = z.infer<typeof ConfirmLinkPayloadSchema>;

export const RejectLinkPayloadSchema = z.object({
  link_id: z.string(),
});

export const SetLinkRateOverridePayloadSchema = z.object({
  link_id: z.string(),
  rate_override: PerMinSchema.nullable(),
});