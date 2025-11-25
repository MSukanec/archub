// Core upload functionality (unified 3-bucket system with media_files + media_links)
export { uploadFile, deleteFile } from './core/uploadFile';
export { getFileUrl, getMediaFileUrl } from './core/getFileUrl';
export type { UploadContext, UploadResult, BucketName } from './core/types';

// Entity-specific uploads (legacy metadata architectures)
export { uploadCourseImageToCourseDetails, deleteCourseCoverImage, getCourseCoverImageUrl, getCourseCoverImageUrlFromData } from './uploads/course';
export { uploadProjectImage, deleteProjectImage, getProjectImageUrl, getProjectImageUrlFromData } from './uploads/project';

// Image transformation utilities (responsive images, srcset, etc)
export { getProjectImageUrl as getProjectImageUrlTransformed, getProjectImagePlaceholder, getProjectImageSrcSet } from './utils/projectImages';
export type { ProjectImageVariant } from './utils/projectImages';

// Utilities
export { createBucketPolicies } from './setupBucketPolicies';
export { uploadToBucket, removeFromBucket, getPublicUrl, storageHelpers } from '@/lib/supabase/storage';
