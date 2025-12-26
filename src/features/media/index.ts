/**
 * Media Feature - Barrel Export
 * 
 * Exporta todas las funcionalidades del módulo de Media
 */
// Types
export type { 
  MediaFile, 
  GalleryFile, 
  DocumentFile, 
  MediaVisibility,
  MediaFileInput,
  UploadMediaResult,
  // V2 Types (nueva arquitectura)
  MediaFileRecord,
  MediaLinkRecord,
  MediaFileWithLink,
  MediaFileType,
  MediaCategory,
  UploadMediaInputV2,
  UploadMediaResultV2
} from './types';
// Constants
export { 
  FILE_TYPES, 
  MAX_FILE_SIZE, 
  VISIBILITY_OPTIONS, 
  QUERY_KEYS,
  STORAGE_BUCKETS
} from './constants';
// Schemas
export { 
  mediaFileSchema,
  galleryFileSchema,
  documentFileSchema,
  uploadMediaSchema
} from './schemas';
// Services
export { getCurrentProject } from './services/getCurrentProject';
export { getGalleryFiles } from './services/getGalleryFiles';
export { deleteMediaFile } from './services/deleteMediaFile';
export { uploadMediaFile } from './services/uploadMediaFile';
// V2 Services (nueva arquitectura media_files + media_links)
export { uploadMediaFileV2 } from './services/uploadMediaFileV2';
export { getGalleryFilesV2 } from './services/getGalleryFilesV2';
export { deleteMediaFileV2, deleteMultipleMediaFilesV2 } from './services/deleteMediaFileV2';
// Hooks
export { useCurrentProject } from './hooks/use-current-project';
export { useGalleryFiles } from './hooks/use-gallery-files';
export { useDeleteMediaFile } from './hooks/use-delete-media-file';
export { useUploadMediaFile } from './hooks/use-upload-media-file';
export { useMediaMetrics } from './hooks/use-media-metrics';
// Components
export { MediaStatsSection } from './components/MediaStatsSection';
