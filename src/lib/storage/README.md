# Storage Architecture - 3 Buckets System

This directory contains the complete implementation of Seencel's 3-bucket storage architecture.

## Architecture Overview

The system uses 3 distinct Supabase Storage buckets for organized, secure multi-tenant file storage:

- **public-assets**: Public content (marketplace, branding, user avatars, course covers)
- **private-assets**: Sensitive business documents (invoices, contracts, permits, financial data)
- **social-assets**: Project-related content (galleries, site logs, collaboration files)

## Core Files

### `types.ts`
Defines all TypeScript types and interfaces:
- `EntityType`: All supported entity types (13 types)
- `BucketName`: The 3 bucket names
- `UploadContext`: Upload configuration
- `UploadResult`: Upload response structure
- `StoragePath`: Path generation result

### `config.ts`
Entity configuration mapping:
- Maps each EntityType to its bucket, path template, compression preset, and visibility
- Provides helper functions: `getEntityConfig()`, `getBucketForEntity()`, `getCompressionPreset()`

### `pathBuilder.ts`
Storage path generation:
- `buildStoragePath()`: Generates unique file paths with templates
- `buildCoverPath()`: Generates predictable cover image paths
- `validateContext()`: Validates required context fields

### `uploadFile.ts`
Centralized upload function:
- **Main function**: `uploadFile(file, context)` - handles entire upload pipeline
- Integrates compression (via `imageCompression.ts`)
- Routes to correct bucket based on entity type
- Creates `media_files` record
- Creates `media_links` record (if `link_to` provided)
- Full error handling and rollback
- **Delete function**: `deleteFile(mediaFileId, hardDelete)` - soft or hard delete

### `uploadHelpers.ts`
Convenience wrapper functions:
- `uploadContactDocument()`
- `uploadSitelogPhoto()`
- `uploadProjectDocument()`
- `uploadInvoice()`
- `uploadUserAvatar()`
- `uploadOrgLogo()`

### `index.ts`
Main export file - exports all functions and types

## Migration Status

### ✅ Completed (New Architecture)
- `uploadCourseImage.ts` - Uses unified uploadFile with cover deduplication
- `uploadProjectImage.ts` - Uses unified uploadFile for project covers
- `uploadMovementFiles.ts` - Uses unified uploadFile for movement attachments

### 🔄 Partial Integration
- Contact attachments - Uses legacy `contact_attachments` table (can migrate to `media_files/media_links`)
- Sitelog photos - Uses `UploadMediaField` component (already has compression, can integrate with unified upload)

### 📋 Future Enhancements
- User avatars - Create dedicated upload function
- Organization logos - Create dedicated upload function
- UI assets - Create upload function for app assets
- Signed URLs - Implement private file access via signed URLs

## Usage Examples

### Upload a Course Cover
```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, {
  entity: 'course_cover_public',
  link_to: { course_id: 'abc-123' },
  category: 'course_cover',
  description: 'Course cover image',
  is_cover: true
});
```

### Upload a Project Photo
```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, {
  entity: 'project_photo',
  organization_id: 'org-123',
  project_id: 'proj-456',
  link_to: { project_id: 'proj-456' },
  category: 'gallery',
  description: 'Project progress photo'
});
```

### Upload an Invoice
```typescript
import { uploadInvoice } from '@/lib/storage/uploadHelpers';

const result = await uploadInvoice(file, 'org-123', 'movement-789');
```

### Delete a File (Soft Delete)
```typescript
import { deleteFile } from '@/lib/storage';

await deleteFile('media-file-id-123', false); // Soft delete (is_deleted = true)
```

### Delete a File (Hard Delete)
```typescript
import { deleteFile } from '@/lib/storage';

await deleteFile('media-file-id-123', true); // Hard delete (removes from storage + DB)
```

## Entity Type → Bucket Mapping

| Entity Type | Bucket | Compression Preset |
|-------------|--------|-------------------|
| `user_avatar` | public-assets | avatar |
| `org_logo` | public-assets | avatar |
| `course_cover_public` | public-assets | course-cover |
| `ui_asset` | public-assets | default |
| `invoice` | private-assets | document |
| `budget` | private-assets | document |
| `contract` | private-assets | document |
| `permit` | private-assets | document |
| `technical_plan` | private-assets | document |
| `contact_document` | private-assets | document |
| `project_photo` | social-assets | project-cover |
| `sitelog_photo` | social-assets | sitelog-photo |
| `project_document` | social-assets | document |

## Database Schema Integration

### `media_files` table
Stores file metadata:
- `id`, `bucket`, `file_path`, `file_url`
- `file_name`, `file_type`, `file_size`
- `is_public`, `is_deleted`
- `organization_id`, `created_by`

### `media_links` table
Links files to entities:
- `media_file_id` (FK to media_files)
- Entity FKs: `project_id`, `contact_id`, `course_id`, `sitelog_id`, etc.
- `category`, `description`, `is_cover`, `position`
- `visibility` ('public' | 'organization' | 'private')

## Security & RLS

- **public-assets**: Public read, authenticated write
- **private-assets**: Organization-scoped RLS (only members can access)
- **social-assets**: Project-scoped RLS (project members can access)

Row-Level Security policies should be configured in Supabase for each bucket.

## Performance & Optimization

### Image Compression
All images are automatically compressed before upload using presets:
- **avatar**: 512px, 90% quality, 0.3MB max
- **course-cover**: 1920px, 90% quality, 1.2MB max
- **project-cover**: 1920px, 85% quality, 1.0MB max
- **sitelog-photo**: 1280px, 80% quality, 0.8MB max
- **document**: 2048px, 85% quality, 1.5MB max (preserves EXIF)

### Caching
- All uploads use `cacheControl: '3600'` (1 hour)
- Public URLs include cache-busting timestamps

## Error Handling

All upload functions:
- Validate context before upload
- Compress images if applicable
- Upload to storage
- Create database records
- **Rollback on failure**: Delete storage file if DB insert fails
- Log all errors with `console.error`
- Throw descriptive errors to caller

## Testing Checklist

When adding new entity types or modifying upload logic:

- [ ] Test file upload to correct bucket
- [ ] Verify `media_files` record created
- [ ] Verify `media_links` record created (if applicable)
- [ ] Test image compression (check console logs)
- [ ] Test error handling (simulate storage failure)
- [ ] Test rollback (simulate DB failure after upload)
- [ ] Test soft delete
- [ ] Test hard delete
- [ ] Verify no orphaned files in storage
- [ ] Check browser console for errors

## Related Documentation

- `/prompts/Upload.md` - Complete upload system documentation
- `/src/lib/imageCompression.ts` - Image compression implementation
- `/src/lib/supabase/storage.ts` - Storage helpers
