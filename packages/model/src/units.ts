import { z } from 'zod';

/** Game centimeters (world coordinates). */
export const CmSchema = z.number().brand<'Cm'>();
export type Cm = z.infer<typeof CmSchema>;

/** Items or m³ per minute. */
export const PerMinSchema = z.number().brand<'PerMin'>();
export type PerMin = z.infer<typeof PerMinSchema>;

/** Megawatts. */
export const MWSchema = z.number().brand<'MW'>();
export type MW = z.infer<typeof MWSchema>;

/** Clock fraction (1.0 = 100%; vanilla max 2.5, mods may exceed). */
export const ClockFractionSchema = z.number().brand<'ClockFraction'>();
export type ClockFraction = z.infer<typeof ClockFractionSchema>;

export const PointCmSchema = z.object({
  x: CmSchema,
  y: CmSchema,
});
export type PointCm = z.infer<typeof PointCmSchema>;