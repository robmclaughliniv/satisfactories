import { z } from 'zod';

export const IncludeMachinePayloadSchema = z.object({
  id: z.string(),
  factory_id: z.string(),
  machine_key: z.string(),
});

export const ExcludeMachinePayloadSchema = z.object({
  id: z.string(),
  factory_id: z.string(),
  machine_key: z.string(),
});

export const ClearMachineOverridePayloadSchema = z.object({
  factory_id: z.string(),
  machine_key: z.string(),
});