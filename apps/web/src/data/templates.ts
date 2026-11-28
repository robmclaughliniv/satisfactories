import { WorldTemplateSchema, type WorldTemplate } from '../model/schema';
import northernStretch from './templates/northern-stretch.json';

/** Bundled sample worlds, validated at module load so bad JSON fails fast in dev. */
export const SAMPLE_WORLD: WorldTemplate = WorldTemplateSchema.parse(northernStretch);
