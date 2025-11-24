/**
 * Re-export project image functions from the centralized storage module.
 * This maintains backward compatibility while using the improved implementation.
 */
export {
  uploadProjectImage,
  deleteProjectImage,
  updateProjectImageUrl,
  updateProjectImageMetadata,
  getProjectImageUrl,
  getProjectImageUrlFromData
} from '@/lib/storage/uploadProjectImage';
