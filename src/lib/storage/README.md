# Storage System

Organized storage architecture with separated concerns for different upload types and utilities.

## Directory Structure

```
src/lib/storage/
├── core/                           # Core unified upload functionality
│   ├── uploadFile.ts              # Universal upload handler (media_files + media_links)
│   ├── getFileUrl.ts              # URL generation with signed URLs support
│   ├── types.ts                   # Shared types (UploadContext, BucketName, etc)
│   ├── config.ts                  # Entity configs, compression presets, visibility rules
│   ├── pathBuilder.ts             # Path generation logic
│   └── index.ts                   # Core barrel export
│
├── uploads/                        # Entity-specific upload functions
│   ├── course.ts                  # Course image uploads (to course_details)
│   ├── project.ts                 # Project image uploads (to project_data)
│   ├── movement.ts                # Movement file uploads (re-exports from legacy)
│   └── index.ts                   # Uploads barrel export
│
├── utils/                         # Utility functions (not uploads)
│   ├── projectImages.ts           # Image transformations, srcset, placeholders
│   └── index.ts                   # Utils barrel export
│
├── legacy/                        # Deprecated functions (backward compatibility only)
│   ├── uploadCourseImage.deprecated.ts        # Old media_files architecture (unused)
│   ├── uploadMovementFiles.deprecated.ts      # Old movement upload (still used, needs migration)
│   └── index.ts
│
├── setupBucketPolicies.ts         # Bucket policy configuration
├── uploadHelpers.ts               # Legacy helpers (review for deprecation)
├── index.ts                       # Main barrel export
└── README.md                      # This file
```

## Usage

### Core Uploads (Recommended for New Features)

Use the unified `uploadFile()` for all new uploads. It handles:
- Automatic image compression
- 3-bucket system (public-assets, private-assets, social-assets)
- Unified media_files + media_links storage
- Signed URL generation for private files

```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, {
  entity: 'sitelog_attachment',
  organization_id: orgId,
  project_id: projectId,
  created_by_member_id: memberId,
  link_to: {
    sitelog_id: siteLogId,
    project_id: projectId
  },
  category: 'photo',
  description: 'Site log photo'
});
```

### Entity-Specific Uploads (Legacy Architectures)

For courses and projects, use specialized functions that handle metadata differently:

```typescript
// Courses (metadata in course_details)
import { uploadCourseImageToCourseDetails } from '@/lib/storage';
const result = await uploadCourseImageToCourseDetails(file, courseId);

// Projects (metadata in project_data)
import { uploadProjectImage } from '@/lib/storage';
const result = await uploadProjectImage(file, projectId, organizationId);
```

### Image Transformations

Apply responsive transformations to project images:

```typescript
import { getProjectImageUrlTransformed, getProjectImageSrcSet } from '@/lib/storage';

// Get optimized variant (thumbnail, card, hero, original)
const cardUrl = getProjectImageUrlTransformed(imageUrl, 'card');

// Get responsive srcset for <img>
const srcset = getProjectImageSrcSet(imageUrl, 'card');

// Get blur placeholder for progressive loading
const placeholder = getProjectImagePlaceholder(imageUrl);
```

## Migration Path

### Old Code → New Code

**Before (scattered uploads):**
```typescript
// Multiple inconsistent approaches
import { uploadProjectImage } from '@/lib/storage/uploadProjectImage';
import { uploadCourseImage } from '@/lib/storage/uploadCourseImage';
import { uploadMovementFiles } from '@/lib/storage/uploadMovementFiles';
```

**After (organized, with clear separation):**
```typescript
// New uploads use unified core
import { uploadFile } from '@/lib/storage/core';

// Legacy uploads kept for backward compatibility
import { uploadProjectImage, uploadCourseImageToCourseDetails } from '@/lib/storage/uploads';

// Utilities for transformation
import { getProjectImageUrlTransformed } from '@/lib/storage/utils';
```

## Entity Types Supported

### Core Uploads (uploadFile + media_files + media_links)
- `sitelog_attachment` - Site log photos/videos/documents
- `project_photo` - Project gallery photos
- `general_cost_payment_attachment` - Cost payment documents
- `contact_document` - Contact supporting documents
- `course_module_image` - Course module images/GIFs
- And more... see `config.ts` for full list

### Legacy Uploads (direct metadata storage)
- `course_cover_public` → course_details.image_bucket/image_path
- `project_cover` → project_data.image_bucket/image_path
- Movements → movement_attachments

## Buckets

| Bucket | Access | Use Case | URL Type |
|--------|--------|----------|----------|
| **public-assets** | Public | Course covers, public images | Public URLs |
| **private-assets** | Private | Site logs, internal documents | Signed URLs (1-hour) |
| **social-assets** | Public | Project covers, social sharing | Public URLs |

## Best Practices

1. **Always use uploadFile() for new features** - It's the modern, consistent approach
2. **Respect entity configurations** - Different entities have different compression presets and buckets
3. **Sign private URLs on-demand** - getFileUrl() handles this automatically
4. **Use transformation utils for images** - Don't hardcode image variants
5. **Document custom uploads** - If adding a new entity, update config.ts with its rules

## Adding a New Entity Upload

1. Add entity type to `core/types.ts`
2. Add config to `core/config.ts` (compression preset, bucket, visibility rules)
3. Use `uploadFile()` with the new entity type
4. If special metadata handling needed, create `uploads/entityName.ts`

Example:
```typescript
// core/config.ts
getEntityConfig('contract_document') => {
  bucket: 'private-assets',
  visibility: 'private'
}

// Then use:
await uploadFile(file, {
  entity: 'contract_document',
  organization_id: orgId,
  link_to: { contact_id: contactId }
});
```

## Deprecated Files

- `uploadCourseImage.ts` - Uses old media_files architecture, not referenced in codebase
- `uploadMovementFiles.ts` - Still used but marked for migration to uploadFile()
- `uploadHelpers.ts` - Legacy helpers, review for consolidation

## Related

- `/shared/schema.ts` - Media tables schema (media_files, media_links)
- `@/lib/imageCompression` - Compression utilities
- `@/lib/supabase/storage` - Low-level Supabase storage helpers
