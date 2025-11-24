# Upload & Image Compression System

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
            └── documents/     ← Contact attachments (DNI, ID cards, certificates)
```

**Entity Routing:**
- `invoice` → `organizations/{org_id}/finance/invoices/`
- `budget` → `organizations/{org_id}/finance/budgets/`
- `contract` → `organizations/{org_id}/legal/contracts/`
- `permit` → `organizations/{org_id}/legal/permits/`
- `technical_plan` → `organizations/{org_id}/technical/plans/`
- `contact_document` → `organizations/{org_id}/contacts/documents/`

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

### Entity Type Reference Table

Complete mapping of all entity types to their bucket destinations:

| Entity Type | Bucket | Base Path | Compression Preset |
|-------------|--------|-----------|-------------------|
| `user_avatar` | public-assets | users/{user_id}/avatars/ | avatar |
| `org_logo` | public-assets | organizations/{org_id}/branding/ | avatar |
| `course_cover_public` | public-assets | marketplace/courses/ | course-cover |
| `ui_asset` | public-assets | app-ui/ | default |
| `invoice` | private-assets | organizations/{org_id}/finance/invoices/ | document |
| `budget` | private-assets | organizations/{org_id}/finance/budgets/ | document |
| `contract` | private-assets | organizations/{org_id}/legal/contracts/ | document |
| `permit` | private-assets | organizations/{org_id}/legal/permits/ | document |
| `technical_plan` | private-assets | organizations/{org_id}/technical/plans/ | document |
| `contact_document` | private-assets | organizations/{org_id}/contacts/documents/ | document |
| `project_photo` | social-assets | projects/{org_id}/{project_id}/gallery/ | project-cover |
| `sitelog_photo` | social-assets | projects/{org_id}/{project_id}/updates/ | sitelog-photo |
| `project_document` | social-assets | projects/{org_id}/{project_id}/documents/ | document |

---

## Architecture

### Core Components

#### 1. Image Compression Utility
**File:** `src/lib/imageCompression.ts`

Central utility that handles all image compression using the `browser-image-compression` library.

**Key Functions:**
```typescript
// Main compression function
compressImage(file: File, preset?: ImagePreset): Promise<File>

// Validation helper
shouldCompress(file: File): boolean
```

#### 2. Compression Presets

Six predefined presets optimized for different use cases:

| Preset | Max Width | Quality | Max Size | Use Case |
|--------|-----------|---------|----------|----------|
| `project-cover` | 1920px | 85% | 1.0 MB | Project cover images |
| `sitelog-photo` | 1280px | 80% | 0.8 MB | Site log / Bitácora photos |
| `course-cover` | 1920px | 90% | 1.2 MB | Course cover images |
| `avatar` | 512px | 90% | 0.3 MB | User/contact avatars |
| `document` | 2048px | 85% | 1.5 MB | Scanned documents (preserves EXIF) |
| `default` | 1600px | 85% | 1.0 MB | Generic images |

### Integration Points

The compression system is integrated into 6 key upload components:

#### 1. Project Cover Images
**Component:** `src/components/ui-custom/fields/UploadImageAndShowField.tsx`
- **Preset:** `project-cover`
- **Trigger:** When user selects/drops project hero image
- **Location:** `handleFileSelect` function

#### 2. Site Log Photos (Bitácora)
**Component:** `src/features/sitelog/modals/SiteLogModal.tsx` + `MediaForm.tsx`
- **Preset:** `sitelog-photo`
- **Trigger:** When user adds photos to site log entries
- **Location:** `MediaForm` component's file handling

#### 3. Course Cover Images
**Component:** `src/features/learning/components/dashboard/CourseHeroImageUpload.tsx`
- **Preset:** `course-cover`
- **Trigger:** When admin uploads course cover image
- **Location:** File selection handler

#### 4. Contact Attachments
**Component:** `src/features/contacts/components/attachments/ContactAttachmentsPanel.tsx`
- **Preset:** Dynamic based on category
  - `avatar` for category='photo'
  - `document` for category='document'
  - `default` for others
- **Trigger:** When adding attachments to contacts

#### 5. Generic Media Upload
**Component:** `src/components/ui-custom/fields/UploadMediaField.tsx`
- **Preset:** Configurable via prop (default: `default`)
- **Trigger:** Multi-purpose file uploads
- **Note:** Only compresses image files

#### 6. Single File Upload
**Component:** `src/components/ui-custom/fields/UploadSingleFileField.tsx`
- **Preset:** `default`
- **Trigger:** Generic single file uploads
- **Note:** Only compresses image files

## User Experience

### Visual Feedback

1. **Compression Loading State:**
   - Shows "Comprimiendo imagen..." message
   - Prevents multiple submissions
   - Maintains responsive UI via Web Workers

2. **Success Notification:**
   ```
   Toast: "Imagen optimizada: 3.2MB → 1.1MB (66% reducción)"
   ```

3. **Error Handling:**
   - If compression fails → uses original file
   - Shows warning toast: "No se pudo comprimir la imagen, se usará el archivo original"

### Console Logging

For debugging, compression stats are logged:
```
[Image Compression]
  Original: 3.2 MB (photo.jpg)
  Compressed: 1.1 MB
  Reduction: 66%
  Preset: project-cover
```

## Technical Details

### Compression Algorithm
Uses `browser-image-compression` with:
- **useWebWorker:** `true` - Non-blocking compression
- **fileType:** Preserves original format (JPEG, PNG, WebP)
- **initialQuality:** Per-preset quality setting
- **preserveExif:** `false` (except `document` preset)

### File Type Detection
```typescript
shouldCompress(file: File): boolean {
  return file.type.startsWith('image/');
}
```

Only compresses:
- image/jpeg
- image/png
- image/webp
- image/gif
- Other image/* types

**Never compresses:**
- Videos (video/*)
- PDFs (application/pdf)
- Documents (application/*)

### Error Recovery
If compression fails (corrupted file, unsupported format, etc.):
1. Logs error to console
2. Shows warning toast to user
3. **Proceeds with original file** - upload is NOT blocked

### Size Validation
Size validation happens **AFTER** compression:
```typescript
// Example from UploadImageAndShowField
const compressedFile = await compressImage(file, 'project-cover');

if (compressedFile.size > 2 * 1024 * 1024) {
  toast({ 
    title: "Error",
    description: "La imagen no puede superar los 2MB",
    variant: "destructive" 
  });
  return;
}
```

## Configuration

### Modifying Presets

To adjust compression settings, edit `src/lib/imageCompression.ts`:

```typescript
const presets: Record<ImagePreset, CompressionOptions> = {
  'project-cover': {
    maxSizeMB: 1.0,           // Increase for higher quality
    maxWidthOrHeight: 1920,   // Increase for larger images
    quality: 0.85,            // 0-1 scale
    useWebWorker: true,
    preserveExif: false
  },
  // ... other presets
};
```

### Adding New Presets

1. Add preset name to `ImagePreset` type
2. Add configuration to `presets` object
3. Use in component:
   ```typescript
   const compressed = await compressImage(file, 'your-new-preset');
   ```

## Performance Considerations

### Benefits
- **Reduced bandwidth:** ~60-80% reduction in upload size
- **Faster uploads:** Especially on mobile/slow connections
- **Storage savings:** Lower Supabase storage costs
- **Better UX:** Quicker page loads with optimized images

### Trade-offs
- **Client-side CPU:** Minimal impact due to Web Workers
- **Compression time:** ~100-500ms for typical images
- **Quality loss:** Negligible with 85-90% quality settings

## Best Practices

### When Adding New Upload Components

1. **Determine appropriate preset:**
   - High-quality displays (covers) → `project-cover` or `course-cover`
   - User-generated photos → `sitelog-photo`
   - Avatars/thumbnails → `avatar`
   - Scanned docs → `document`
   - Unknown → `default`

2. **Import compression utility:**
   ```typescript
   import { compressImage, shouldCompress } from '@/lib/imageCompression';
   ```

3. **Add loading state:**
   ```typescript
   const [isCompressing, setIsCompressing] = useState(false);
   ```

4. **Compress before upload:**
   ```typescript
   const handleFileSelect = async (file: File) => {
     // Type validation first
     if (!shouldCompress(file)) {
       uploadFile(file);
       return;
     }
     
     // Compress
     setIsCompressing(true);
     try {
       const compressed = await compressImage(file, 'preset-name');
       uploadFile(compressed);
     } catch (error) {
       console.error('Compression failed:', error);
       uploadFile(file); // Fallback to original
     } finally {
       setIsCompressing(false);
     }
   };
   ```

5. **Update loading messages:**
   ```typescript
   {isCompressing ? 'Comprimiendo...' : isUploading ? 'Subiendo...' : 'Seleccionar'}
   ```

### Testing Checklist

When testing compression changes:

- [ ] Upload various image formats (JPG, PNG, WebP)
- [ ] Upload large images (5MB+) - verify compression works
- [ ] Upload small images (<100KB) - verify no over-compression
- [ ] Upload non-images (PDF, video) - verify they're not compressed
- [ ] Check browser console for compression stats
- [ ] Verify upload success with compressed files
- [ ] Test drag-and-drop functionality
- [ ] Test file input selection
- [ ] Check mobile device uploads (crucial for sitelog photos)

## Troubleshooting

### Common Issues

**Q: Images still too large after compression?**
- A: Reduce `maxSizeMB` in preset configuration
- A: Lower `quality` setting (try 0.75-0.80)
- A: Reduce `maxWidthOrHeight` dimension

**Q: Compression taking too long?**
- A: Verify `useWebWorker: true` is set
- A: Check browser console for errors
- A: Reduce `maxWidthOrHeight` for faster processing

**Q: Image quality degraded too much?**
- A: Increase `quality` setting (try 0.90-0.95)
- A: Increase `maxSizeMB` limit
- A: Use higher resolution `maxWidthOrHeight`

**Q: Upload fails with compressed images?**
- A: Check Supabase storage bucket CORS settings
- A: Verify file type is still valid after compression
- A: Check network logs for actual error message

### Debug Mode

Enable detailed logging in `imageCompression.ts`:
```typescript
const DEBUG = true; // Set to true for verbose logging
```

This will log:
- Input file details
- Compression options used
- Output file details
- Processing time
- Reduction percentage

## Dependencies

- **browser-image-compression:** `^2.0.2`
  - Pure JavaScript, no native dependencies
  - Works in all modern browsers
  - Supports Web Workers for non-blocking compression

## Future Enhancements

Potential improvements to consider:

1. **Format conversion:** Convert PNG → WebP for better compression
2. **Responsive images:** Generate multiple sizes (thumbnail, medium, large)
3. **Server-side fallback:** Use Sharp on backend for older browsers
4. **Progressive uploads:** Upload low-res preview first, then full quality
5. **Batch compression:** Optimize multiple images in parallel
6. **Compression analytics:** Track compression ratios, storage savings
7. **User preferences:** Allow users to choose quality vs. speed

## Database Migration: Project Image Persistence

### Problem

Previously, `uploadProjectImage()` saved signed URLs (which expire after 1 hour) in `project_data.project_image_url`, causing project cover images to disappear after the URL expired.

### Solution

The system now saves **bucket + path** metadata instead of signed URLs, generating URLs on-demand when rendering. This prevents URL expiration issues.

### Migration Required

To support the new architecture, the `project_data` table needs two additional columns:

```sql
ALTER TABLE project_data
ADD COLUMN image_bucket TEXT,
ADD COLUMN image_path TEXT;
```

**Columns:**
- `image_bucket` (text, nullable) - The storage bucket name (e.g., 'social-assets')
- `image_path` (text, nullable) - The file path within the bucket

### Implementation Details

**1. Schema Updates (shared/schema.ts)**
```typescript
export const project_data = pgTable("project_data", {
  // ... existing fields ...
  project_image_url: text("project_image_url"),  // Legacy field (may contain expired URLs)
  image_bucket: text("image_bucket"),             // NEW: Bucket name
  image_path: text("image_path"),                 // NEW: File path
  // ... other fields ...
});
```

**2. Upload Function (src/lib/storage/uploadProjectImage.ts)**

The `uploadProjectImage()` function now:
- Saves `bucket` + `path` to `project_data.image_bucket` and `project_data.image_path`
- Does NOT save signed URLs to `project_data.project_image_url`

```typescript
export async function updateProjectImageMetadata(
  projectId: string,
  organizationId: string,
  bucket: BucketName,
  path: string
): Promise<void> {
  const { error } = await supabase
    .from('project_data')
    .upsert({
      project_id: projectId,
      organization_id: organizationId,
      image_bucket: bucket,
      image_path: path,
      // DO NOT update project_image_url with signed URL - it will expire!
    }, {
      onConflict: 'project_id'
    });

  if (error) throw new Error(`Failed to update project image: ${error.message}`);
}
```

**3. URL Generation Helpers**

Two helper functions generate signed URLs on-demand:

```typescript
// From projectId (requires DB query)
export async function getProjectImageUrl(projectId: string): Promise<string | null>

// From existing project data (no DB query needed)
export async function getProjectImageUrlFromData(
  project: { image_bucket?: string | null; image_path?: string | null }
): Promise<string | null>
```

**4. Component Usage**

Components now generate URLs on-demand instead of reading `project_image_url`:

```typescript
// In ProjectBasicDataTab.tsx
useEffect(() => {
  if (projectData?.image_bucket && projectData?.image_path) {
    getProjectImageUrlFromData({
      image_bucket: projectData.image_bucket,
      image_path: projectData.image_path
    }).then(url => setProjectImageUrl(url));
  }
}, [projectData]);
```

### Migration Checklist

- [ ] Run database migration to add `image_bucket` and `image_path` columns
- [ ] Update existing project images (re-upload or backfill metadata)
- [ ] Verify project cover images display correctly
- [ ] Test image upload/deletion functionality
- [ ] Confirm URLs don't expire after 1 hour

### Benefits

- ✅ Project cover images **never expire**
- ✅ Metadata (`bucket` + `path`) persisted in database
- ✅ Signed URLs generated **on-demand** when rendering
- ✅ **Zero** expired URLs stored in database
- ✅ Backward compatible (old `project_image_url` still works during migration)

## Related Documentation

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [browser-image-compression GitHub](https://github.com/Donaldcwl/browser-image-compression)
- [Media Management System](./tables/media.md)
- [Project Management](./tables/projects.md)
