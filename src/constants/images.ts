import { getPublicUrl } from '@/lib/supabase/storage';
/**
 * Feature images stored in Supabase Storage (public-assets/app-ui/features/)
 * These images are used in plan restriction modals
 */
export const FEATURE_IMAGES = {
  PROJECTS: getPublicUrl('public-assets', 'app-ui/features/ft-projects-512.webp'),
  MEMBERS: getPublicUrl('public-assets', 'app-ui/features/ft-members-512.webp'),
} as const;
