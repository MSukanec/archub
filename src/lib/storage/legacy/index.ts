/**
 * DEPRECATED: Legacy upload functions kept for backward compatibility
 * These use old data architectures (direct metadata in tables instead of media_files+media_links)
 * 
 * NEW CODE: Use the unified uploadFile() from /core instead
 */

export { uploadCourseImage as uploadCourseImageOld } from './uploadCourseImage.deprecated';
export { uploadMovementFiles as uploadMovementFilesOld } from './uploadMovementFiles.deprecated';
