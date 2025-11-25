/**
 * Centralized helper for optimizing project images using Supabase Storage transformations.
 * 
 * Supabase Storage provides on-the-fly image transformations via the render API:
 * /storage/v1/render/image/public/<bucket>/<path>?width=&height=&resize=&format=&quality=
 * 
 * This helper ensures consistent, optimized image loading across all project image displays.
 */

export type ProjectImageVariant = 'thumbnail' | 'card' | 'hero' | 'original';

interface TransformationParams {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'origin';
  resize: 'cover' | 'contain' | 'fill';
}

/**
 * Configuration for each image variant
 * - thumbnail: Small previews (selectors, lists)
 * - card: Project cards in grids (main use case)
 * - hero: Large displays (dashboard headers, full-width sections)
 * - original: No transformation (fallback)
 */
const VARIANT_CONFIG: Record<ProjectImageVariant, TransformationParams | null> = {
  thumbnail: {
    width: 400,
    height: 300,
    quality: 70,
    format: 'webp',
    resize: 'cover'
  },
  card: {
    width: 960,
    height: 720,
    quality: 75,
    format: 'webp',
    resize: 'cover'
  },
  hero: {
    width: 1600,
    height: 900,
    quality: 80,
    format: 'webp',
    resize: 'cover'
  },
  original: null
};

/**
 * Extracts the storage path from a Supabase public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/project-image/org/proj/hero.jpg
 * Returns: org/proj/hero.jpg
 */
function extractStoragePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!match) return null;
  
  const bucket = match[1];
  const path = match[2];
  
  // Only process project-image bucket
  if (bucket !== 'project-image') return null;
  
  return path;
}

/**
 * Extracts the base URL (project reference) from a Supabase URL
 * Example: https://wtatvsgeivymcppowrfy.supabase.co/storage/...
 * Returns: https://wtatvsgeivymcppowrfy.supabase.co
 */
function extractBaseUrl(url: string): string | null {
  const match = url.match(/(https:\/\/[^/]+\.supabase\.co)/);
  return match ? match[1] : null;
}

/**
 * Generates an optimized image URL using Supabase Storage transformations.
 * 
 * @param imageUrl - The original image URL (from project_data.project_image_url)
 * @param variant - The image variant to generate (thumbnail, card, hero, or original)
 * @returns Optimized image URL or original URL if transformations can't be applied
 * 
 * @example
 * ```tsx
 * const cardImage = getProjectImageUrl(project.project_data?.project_image_url, 'card');
 * <img src={cardImage} alt={project.name} loading="lazy" />
 * ```
 */
export function getProjectImageUrl(
  imageUrl: string | null | undefined,
  variant: ProjectImageVariant = 'card'
): string | null {
  // Return null if no URL provided
  if (!imageUrl) return null;
  
  // Return original if variant is 'original' or not transformable
  const config = VARIANT_CONFIG[variant];
  if (!config) return imageUrl;
  
  // Extract storage path and base URL
  const storagePath = extractStoragePath(imageUrl);
  const baseUrl = extractBaseUrl(imageUrl);
  
  // If we can't extract path or base URL, return original
  if (!storagePath || !baseUrl) return imageUrl;
  
  // Build transformation URL
  const params = new URLSearchParams({
    width: config.width.toString(),
    height: config.height.toString(),
    resize: config.resize,
    quality: config.quality.toString()
  });
  
  // Only add format if webp (origin is default)
  if (config.format === 'webp') {
    params.append('format', 'webp');
  }
  
  // Construct the render URL
  const transformedUrl = `${baseUrl}/storage/v1/render/image/public/project-image/${storagePath}?${params.toString()}`;
  
  return transformedUrl;
}

/**
 * Generates a blurred placeholder image URL for progressive loading.
 * Uses a tiny 40x30 heavily blurred version for instant loading.
 * 
 * @param imageUrl - The original image URL
 * @returns Blurred placeholder URL or null
 * 
 * @example
 * ```tsx
 * const placeholder = getProjectImagePlaceholder(project.project_data?.project_image_url);
 * // Use as background while loading full image
 * ```
 */
export function getProjectImagePlaceholder(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;
  
  const storagePath = extractStoragePath(imageUrl);
  const baseUrl = extractBaseUrl(imageUrl);
  
  if (!storagePath || !baseUrl) return null;
  
  const params = new URLSearchParams({
    width: '40',
    height: '30',
    resize: 'cover',
    quality: '30',
    blur: '20'
  });
  
  return `${baseUrl}/storage/v1/render/image/public/project-image/${storagePath}?${params.toString()}`;
}

/**
 * Generates responsive srcset for <img> elements to support different screen densities.
 * 
 * @param imageUrl - The original image URL
 * @param variant - Base variant to use
 * @returns srcset string or undefined if not applicable
 * 
 * @example
 * ```tsx
 * <img 
 *   src={getProjectImageUrl(url, 'card')}
 *   srcSet={getProjectImageSrcSet(url, 'card')}
 *   loading="lazy"
 * />
 * ```
 */
export function getProjectImageSrcSet(
  imageUrl: string | null | undefined,
  variant: ProjectImageVariant = 'card'
): string | undefined {
  if (!imageUrl) return undefined;
  
  const config = VARIANT_CONFIG[variant];
  if (!config) return undefined;
  
  const storagePath = extractStoragePath(imageUrl);
  const baseUrl = extractBaseUrl(imageUrl);
  
  if (!storagePath || !baseUrl) return undefined;
  
  // Generate 1x and 2x versions
  const srcset: string[] = [];
  
  // 1x
  const params1x = new URLSearchParams({
    width: config.width.toString(),
    height: config.height.toString(),
    resize: config.resize,
    quality: config.quality.toString()
  });
  if (config.format === 'webp') params1x.append('format', 'webp');
  srcset.push(`${baseUrl}/storage/v1/render/image/public/project-image/${storagePath}?${params1x.toString()} 1x`);
  
  // 2x (higher resolution for retina displays)
  const params2x = new URLSearchParams({
    width: Math.round(config.width * 1.5).toString(),
    height: Math.round(config.height * 1.5).toString(),
    resize: config.resize,
    quality: Math.max(config.quality - 5, 60).toString() // Slightly lower quality for 2x
  });
  if (config.format === 'webp') params2x.append('format', 'webp');
  srcset.push(`${baseUrl}/storage/v1/render/image/public/project-image/${storagePath}?${params2x.toString()} 2x`);
  
  return srcset.join(', ');
}
