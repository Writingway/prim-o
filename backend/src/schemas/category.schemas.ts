import z from 'zod';
import { safeText } from '../lib/validation';

// Icon names must exist in the front-end Icon component set; keep this list in sync with it.
const VALID_ICONS = ['home','gift','received','user','users','bell','search','flame','trophy',
  'shield','mail','lock','phone','check','plus','minus','send','building','card','envelope',
  'chart','alert','info','copy','logout','settings','clock','star','coffee','ticket','heart',
  'plane','trash','chevron-right','chevron-down','arrow-left','arrow-up'] as const;

export const createCategorySchema = z.object({
  label:     safeText(1),
  icon:      z.enum(VALID_ICONS),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sortOrder: z.number().int().min(0).optional(),
  slug:      z.string().regex(/^[a-z0-9-]+$/).min(1),
});

export const updateCategorySchema = z.object({
  label:     safeText(1).optional(),
  icon:      z.enum(VALID_ICONS).optional(),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive:  z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
