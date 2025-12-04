# Upload & Storage System

## Overview

Seencel implements a comprehensive file upload system with:
1. **3-Bucket Architecture** for organized, secure storage with proper multi-tenancy
2. **Client-side Image Compression** that automatically optimizes images before upload
3. **Unified Upload Function** that handles routing, compression, and database transactions
4. **media_files + media_links** relational model for flexible file management

This system reduces bandwidth usage, speeds up uploads, improves security, and ensures scalable multi-tenant file organization.

---

## Storage Architecture (3 Buckets)

### Bucket Overview

Seencel uses **3 distinct Supabase Storage buckets**, each with specific security and organizational purposes:

| Bucket | Visibility | Purpose | RLS Policy |
|--------|-----------|---------|------------|
| **public-assets** | Public | Marketplace, branding, UI assets, public user avatars | Public read, authenticated write |
| **private-assets** | Private | Financial docs, legal contracts, sensitive organizational data | Org-scoped RLS |
| **social-assets** | Hybrid | Project galleries, site log photos, team collaboration content | Project-scoped RLS |

### Bucket Structure & Routing Rules

#### 1. public-assets (Public Bucket)

**Purpose:** Content that needs to be accessible without authentication (marketplace, public profiles, UI assets)

**Structure:**
```
public-assets/
├── users/
│   └── {user_id}/
│       └── avatars/          ← User profile pictures
├── organizations/
│   └── {org_id}/
│       ├── branding/          ← Company logos, brand assets
│       └── public-profiles/   ← Public organization profiles
├── marketplace/
│   └── courses/               ← Public course covers, promotional images
├── app-ui/                    ← App UI assets (empty states, icons)
└── landing/                   ← Landing page images, marketing
```

**Entity Routing:**
- `user_avatar` → `users/{user_id}/avatars/`
- `org_logo` → `organizations/{org_id}/branding/`
- `course_cover_public` → `marketplace/courses/`
- `course_module_image` → `marketplace/courses/`
- `ui_asset` → `app-ui/`

#### 2. private-assets (Private Bucket)

**Purpose:** Sensitive business documents, financial data, legal contracts (high security, org-scoped access only)

**Structure:**
```
private-assets/
└── organizations/
    └── {org_id}/
        ├── finance/
        │   ├── invoices/      ← Supplier invoices, payment receipts
        │   ├── budgets/       ← Project budgets, cost estimates
        │   └── reports/       ← Financial reports
        ├── legal/
        │   ├── contracts/     ← Client contracts, subcontractor agreements
        │   └── permits/       ← Building permits, licenses
        ├── technical/
        │   ├── plans/         ← Architectural plans, blueprints
        │   └── specs/         ← Technical specifications
        └── contacts/
            ├── documents/     ← Contact attachments (DNI, ID cards, certificates)
            └── avatars/       ← Contact avatar images
```

**Entity Routing:**
- `invoice` → `organizations/{org_id}/finance/invoices/`
- `budget` → `organizations/{org_id}/finance/budgets/`
- `contract` → `organizations/{org_id}/legal/contracts/`
- `permit` → `organizations/{org_id}/legal/permits/`
- `technical_plan` → `organizations/{org_id}/technical/plans/`
- `contact_document` → `organizations/{org_id}/contacts/documents/`
- `contact_avatar` → `organizations/{org_id}/contacts/avatars/`

#### 3. social-assets (Hybrid Bucket)

**Purpose:** Project-related content, team collaboration, construction site documentation (project-scoped visibility)

**Structure:**
```
social-assets/
└── projects/
    └── {org_id}/
        └── {project_id}/
            ├── gallery/       ← Project photos, renders, progress shots
            ├── updates/       ← Site log photos, daily reports
            └── documents/     ← Shared project documents
```

**Entity Routing:**
- `project_photo` → `projects/{org_id}/{project_id}/gallery/`
- `sitelog_photo` → `projects/{org_id}/{project_id}/updates/`
- `project_document` → `projects/{org_id}/{project_id}/documents/`

---

## Entity Type Reference Table

Complete mapping of all entity types to their bucket destinations:

| Entity Type | Bucket | Base Path | Compression Preset |
|-------------|--------|-----------|-------------------|
| `user_avatar` | public-assets | users/{user_id}/avatars/ | avatar |
| `org_logo` | public-assets | organizations/{org_id}/branding/ | avatar |
| `course_cover_public` | public-assets | marketplace/courses/ | course-cover |
| `course_module_image` | public-assets | marketplace/courses/ | course-cover |
| `ui_asset` | public-assets | app-ui/ | default |
| `invoice` | private-assets | organizations/{org_id}/finance/invoices/ | document |
| `budget` | private-assets | organizations/{org_id}/finance/budgets/ | document |
| `contract` | private-assets | organizations/{org_id}/legal/contracts/ | document |
| `permit` | private-assets | organizations/{org_id}/legal/permits/ | document |
| `technical_plan` | private-assets | organizations/{org_id}/technical/plans/ | document |
| `contact_document` | private-assets | organizations/{org_id}/contacts/documents/ | document |
| `contact_avatar` | private-assets | organizations/{org_id}/contacts/avatars/ | avatar |
| `project_photo` | social-assets | projects/{org_id}/{project_id}/gallery/ | project-cover |
| `sitelog_photo` | social-assets | projects/{org_id}/{project_id}/updates/ | sitelog-photo |
| `project_document` | social-assets | projects/{org_id}/{project_id}/documents/ | document |
| `client_payment_attachment` | private-assets | organizations/{org_id}/finance/payments/ | document |
| `general_cost_payment_attachment` | private-assets | organizations/{org_id}/finance/general-costs/ | document |

---

## Core Files

### Location: `src/lib/storage/`

#### `types.ts`
Defines all TypeScript types and interfaces:
- `EntityType`: All supported entity types
- `BucketName`: The 3 bucket names
- `UploadContext`: Upload configuration
- `UploadResult`: Upload response structure
- `StoragePath`: Path generation result

#### `config.ts`
Entity configuration mapping:
- Maps each EntityType to its bucket, path template, compression preset, and visibility
- Provides helper functions: `getEntityConfig()`, `getBucketForEntity()`, `getCompressionPreset()`

#### `pathBuilder.ts`
Storage path generation:
- `buildStoragePath()`: Generates unique file paths with templates
- `buildCoverPath()`: Generates predictable cover image paths
- `validateContext()`: Validates required context fields

#### `uploadFile.ts`
Centralized upload function:
- **Main function**: `uploadFile(file, context)` - handles entire upload pipeline
- Integrates compression (via `imageCompression.ts`)
- Routes to correct bucket based on entity type
- Creates `media_files` record
- Creates `media_links` record (if `link_to` provided)
- Full error handling and rollback
- **Delete function**: `deleteFile(mediaFileId, hardDelete)` - soft or hard delete

#### `uploadHelpers.ts`
Convenience wrapper functions:
- `uploadContactDocument()`
- `uploadContactAvatar()`
- `uploadSitelogPhoto()`
- `uploadProjectDocument()`
- `uploadInvoice()`
- `uploadUserAvatar()`
- `uploadOrgLogo()`

#### `index.ts`
Main export file - exports all functions and types

---

## Image Compression System

### Location: `src/lib/imageCompression.ts`

Central utility that handles all image compression using the `browser-image-compression` library.

**Key Functions:**
```typescript
// Main compression function
compressImage(file: File, preset?: ImagePreset): Promise<File>

// Validation helper
shouldCompress(file: File): boolean
```

### Compression Presets

Six predefined presets optimized for different use cases:

| Preset | Max Width | Quality | Max Size | Use Case |
|--------|-----------|---------|----------|----------|
| `avatar` | 512px | 90% | 0.3 MB | User/contact avatars |
| `course-cover` | 1920px | 90% | 1.2 MB | Course cover images |
| `project-cover` | 1920px | 85% | 1.0 MB | Project cover images |
| `sitelog-photo` | 1280px | 80% | 0.8 MB | Site log / Bitácora photos |
| `document` | 2048px | 85% | 1.5 MB | Scanned documents (preserves EXIF) |
| `default` | 1600px | 85% | 1.0 MB | Generic images |

### File Type Detection

```typescript
shouldCompress(file: File): boolean {
  return file.type.startsWith('image/');
}
```

Only compresses:
- image/jpeg, image/png, image/webp, image/gif

**Never compresses:**
- Videos (video/*)
- PDFs (application/pdf)
- Documents (application/*)

---

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

### Upload a Contact Avatar
```typescript
import { uploadContactAvatar } from '@/lib/storage';

const result = await uploadContactAvatar(file, contactId, organizationId);
```

### Upload a Client Payment Attachment
```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, {
  entity: 'client_payment_attachment',
  organization_id: organizationId,
  project_id: projectId,
  created_by_member_id: currentMemberId,
  link_to: {
    client_payment_id: paymentId,
  },
  category: 'document',
  description: 'Payment receipt',
});
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

---

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
- Entity FKs: `project_id`, `contact_id`, `course_id`, `site_log_id`, `movement_id`, `general_cost_id`, `client_payment_id`, `course_module_id`, `course_lesson_id`, etc.
- `category`, `description`, `is_cover`, `position`
- `visibility` ('public' | 'organization' | 'private')

### Adding New Entity Relations

If your entity doesn't have a FK in `media_links`:

```sql
-- Add new column
ALTER TABLE public.media_links 
ADD COLUMN your_entity_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE public.media_links 
ADD CONSTRAINT media_links_your_entity_fkey 
FOREIGN KEY (your_entity_id) 
REFERENCES your_table (id) 
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_media_links_your_entity 
ON public.media_links 
USING btree (your_entity_id) 
WHERE (your_entity_id IS NOT NULL AND organization_id IS NOT NULL);
```

---

## Security & RLS

- **public-assets**: Public read, authenticated write
- **private-assets**: Organization-scoped RLS (only members can access)
- **social-assets**: Project-scoped RLS (project members can access)

Row-Level Security policies should be configured in Supabase for each bucket.

---

## Signed URLs for Private Files

Private files require signed URLs for access. Generate on-demand:

```typescript
// From bucket + path
const { data } = await supabase.storage
  .from(bucket)
  .createSignedUrl(path, 3600); // 1 hour expiry

const signedUrl = data?.signedUrl;
```

### Project Image URL Generation

For project covers, use the helper functions:

```typescript
// From projectId (requires DB query)
export async function getProjectImageUrl(projectId: string): Promise<string | null>

// From existing project data (no DB query needed)
export async function getProjectImageUrlFromData(
  project: { image_bucket?: string | null; image_path?: string | null }
): Promise<string | null>
```

---

## Error Handling

All upload functions:
- Validate context before upload
- Compress images if applicable
- Upload to storage
- Create database records
- **Rollback on failure**: Delete storage file if DB insert fails
- Log all errors with `console.error`
- Throw descriptive errors to caller

---

## Best Practices

### When Adding New Upload Components

1. **Determine appropriate preset:**
   - High-quality displays (covers) → `project-cover` or `course-cover`
   - User-generated photos → `sitelog-photo`
   - Avatars/thumbnails → `avatar`
   - Scanned docs → `document`
   - Unknown → `default`

2. **Import from storage lib:**
   ```typescript
   import { uploadFile } from '@/lib/storage';
   import { compressImage, shouldCompress } from '@/lib/imageCompression';
   ```

3. **Always use entity types** - never hardcode bucket names

4. **Include `link_to`** for automatic media_links creation

5. **Use `created_by_member_id`** with organization_member.id (NOT user.id)

---

## ⚠️ CRITICAL: Adding New MediaCategory Types

**This is a recurring issue!** When adding a new `category` value for `media_links`, you MUST update BOTH:

### Checklist for New Categories

- [ ] **1. TypeScript types** (`src/features/media/types/index.ts`)
  - Add to `MediaCategory` type

- [ ] **2. PostgreSQL constraint** (`prompts/tables/media.md`)
  - Add to `media_links_category_check` array
  - **Generate SQL migration for user to execute in Supabase**

### Current Valid Categories (PostgreSQL)

```
document, photo, other, general, technical, financial, legal,
course_cover, instructor_photo, module_image, section_background,
testimonial_logo, testimonial_avatar, project_photo, og_image,
client_gallery
```

### SQL to Add a New Category

```sql
-- Replace the constraint with the updated list
ALTER TABLE public.media_links
DROP CONSTRAINT media_links_category_check;

ALTER TABLE public.media_links
ADD CONSTRAINT media_links_category_check CHECK (
  (category IS NULL) OR (
    category = ANY (ARRAY[
      'document'::text,
      'photo'::text,
      'other'::text,
      'general'::text,
      'technical'::text,
      'financial'::text,
      'legal'::text,
      'course_cover'::text,
      'instructor_photo'::text,
      'module_image'::text,
      'section_background'::text,
      'testimonial_logo'::text,
      'testimonial_avatar'::text,
      'project_photo'::text,
      'og_image'::text,
      'client_gallery'::text,
      'NEW_CATEGORY_HERE'::text  -- Add new category here
    ])
  )
);
```

**Remember:** The AI agent cannot execute SQL directly. Always provide the SQL to the user for execution in Supabase SQL Editor.

### Testing Checklist

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

---

## Migration Status

### ✅ Completed (New Architecture)
- Course images (cover, module, instructor)
- Project images (cover, gallery)
- Movement attachments
- Sitelog photos
- Contact avatars
- General cost payment attachments
- Client payment attachments

### 🔄 Partial Integration
- Some legacy components may still use old patterns

---

## Dependencies

- **browser-image-compression:** `^2.0.2`
  - Pure JavaScript, no native dependencies
  - Works in all modern browsers
  - Supports Web Workers for non-blocking compression

---

## Related Files

- **Storage lib**: `src/lib/storage/`
- **Image compression**: `src/lib/imageCompression.ts`
- **Media types**: `src/features/media/types/`
- **Table schema**: `prompts/tables/media.md`
