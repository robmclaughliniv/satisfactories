import { z } from 'zod';

export const WorldOriginSchema = z.enum(['manual', 'save']);
export type WorldOrigin = z.infer<typeof WorldOriginSchema>;