import { z } from 'zod';

export const DismissAuditItemPayloadSchema = z.object({
  id: z.string(),
  fingerprint: z.string(),
});

export const UndismissAuditItemPayloadSchema = z.object({
  fingerprint: z.string(),
});