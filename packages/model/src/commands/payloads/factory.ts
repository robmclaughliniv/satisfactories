import { z } from 'zod';
import { StatusSchema } from '../../schema';
import { FloorSettingsSchema } from '../../decisions/tables';
import { PointCmSchema } from '../../units';

export const CreateFactoryPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  status: StatusSchema,
  tier: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  cover: z.string(),
});
export type CreateFactoryPayload = z.infer<typeof CreateFactoryPayloadSchema>;

export const UpdateFactoryMetaPayloadSchema = z.object({
  factory_id: z.string(),
  patch: z
    .object({
      name: z.string().optional(),
      color: z.string().optional(),
      status: StatusSchema.optional(),
      tier: z.string().optional(),
      tagline: z.string().optional(),
      tags: z.array(z.string()).optional(),
      cover: z.string().optional(),
      notes: z.string().optional(),
      favorite_items: z.array(z.string()).optional(),
      import_order: z.array(z.string()).optional(),
      export_order: z.array(z.string()).optional(),
    })
    .refine((p) => Object.keys(p).length > 0, { message: 'patch must not be empty' }),
});

export const DrawFactoryShapePayloadSchema = z.object({
  factory_id: z.string(),
  points: z.array(PointCmSchema).min(3),
});

export const EditFactoryShapePayloadSchema = z.object({
  factory_id: z.string(),
  points: z.array(PointCmSchema).min(3),
});

export const ClearFactoryShapePayloadSchema = z.object({
  factory_id: z.string(),
});

export const SetFloorSettingsPayloadSchema = z.object({
  factory_id: z.string(),
  floor_settings: FloorSettingsSchema,
});

export const DeleteFactoryPayloadSchema = z.object({
  factory_id: z.string(),
});