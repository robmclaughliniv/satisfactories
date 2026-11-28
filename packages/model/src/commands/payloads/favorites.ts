import { z } from 'zod';

export const ToggleFavoriteItemPayloadSchema = z.object({
  item: z.string(),
});

export const ToggleFavoriteFactoryPayloadSchema = z.object({
  factory_id: z.string(),
});