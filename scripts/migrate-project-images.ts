import { supabaseAdmin } from '../src/lib/supabaseAdmin';
import { db } from '../server/db';
import { projects, project_data } from '../shared/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

/**
 * Migration Script: Legacy Project Images → New 3-Bucket Architecture
 * 
 * This script migrates existing project cover images from the legacy bucket
 * structure to the new 3-bucket architecture with metadata persistence.
 * 
 * WHAT IT DOES:
 * 1. Finds projects with project_image_url but missing image_bucket/image_path
 * 2. Downloads images from legacy bucket (project-image)
 * 3. Re-uploads to new bucket (social-assets) with proper path structure
 * 4. Updates database with new metadata (image_bucket + image_path)
 * 5. Optionally deletes old images from legacy bucket
 * 
 * USAGE:
 * npm run migrate:images [--delete-old]
 * 
 * FLAGS:
 * --delete-old: Remove images from legacy bucket after successful migration
 * --dry-run: Show what would be migrated without making changes
 * --skip-missing-org: Skip projects without organization_id instead of failing
 */

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_OLD = process.argv.includes('--delete-old');
const SKIP_MISSING_ORG = process.argv.includes('--skip-missing-org');
const NEW_BUCKET = 'social-assets';
const LEGACY_BUCKET = 'project-image';

interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ projectId: string; error: string }>;
}

const stats: MigrationStats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

/**
 * Extract filename from legacy URL
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    return null;
  }
}

/**
 * Extract bucket path from legacy URL
 * Example: project-image/abc123/xyz789/hero.jpg → abc123/xyz789/hero.jpg
 */
function extractLegacyPath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Remove empty strings and 'storage/v1/object/public' parts
    const cleanParts = pathParts.filter(p => p && p !== 'storage' && p !== 'v1' && p !== 'object' && p !== 'public' && p !== LEGACY_BUCKET);
    return cleanParts.join('/');
  } catch (error) {
    return null;
  }
}

/**
 * Build new storage path following 3-bucket architecture
 */
function buildNewPath(organizationId: string, projectId: string, filename: string): string {
  return `projects/${organizationId}/${projectId}/gallery/${filename}`;
}

/**
 * Migrate a single project image
 */
async function migrateProjectImage(project: {
  id: string;
  name: string;
  organization_id: string | null;
  project_image_url: string | null;
}): Promise<boolean> {
  try {
    console.log(`\n[${project.id}] Migrating: ${project.name}`);
    
    // Validate organization_id
    if (!project.organization_id) {
      if (SKIP_MISSING_ORG) {
        console.log(`  ⏭️  Skipping: Missing organization_id`);
        stats.skipped++;
        return false;
      }
      throw new Error('Project has no organization_id. Use --skip-missing-org to skip these.');
    }
    
    // Validate project_image_url
    if (!project.project_image_url) {
      console.log(`  ⏭️  Skipping: No image URL`);
      stats.skipped++;
      return false;
    }
    
    console.log(`  Old URL: ${project.project_image_url}`);

    // Extract legacy path
    const legacyPath = extractLegacyPath(project.project_image_url);
    if (!legacyPath) {
      throw new Error('Could not extract legacy path from URL');
    }
    console.log(`  Legacy path: ${LEGACY_BUCKET}/${legacyPath}`);

    // Extract filename
    const filename = extractFilenameFromUrl(project.project_image_url);
    if (!filename) {
      throw new Error('Could not extract filename from URL');
    }

    // Build new path
    const newPath = buildNewPath(project.organization_id, project.id, filename);
    console.log(`  New path: ${NEW_BUCKET}/${newPath}`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would migrate to: ${NEW_BUCKET}/${newPath}`);
      stats.successful++;
      return true;
    }

    // Download from legacy bucket
    console.log(`  Downloading from legacy bucket...`);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(LEGACY_BUCKET)
      .download(legacyPath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download: ${downloadError?.message || 'No data'}`);
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`  Downloaded ${buffer.length} bytes`);

    // Determine content type
    const contentType = fileData.type || 'image/jpeg';

    // Upload to new bucket
    console.log(`  Uploading to new bucket...`);
    const { error: uploadError } = await supabaseAdmin.storage
      .from(NEW_BUCKET)
      .upload(newPath, buffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    // Update database with new metadata
    console.log(`  Updating database metadata...`);
    const updateResult = await db
      .update(project_data)
      .set({
        image_bucket: NEW_BUCKET,
        image_path: newPath,
      })
      .where(eq(project_data.project_id, project.id));
    
    // Validate update
    if (!updateResult || updateResult.rowCount !== 1) {
      throw new Error(`Failed to update database: expected 1 row, got ${updateResult?.rowCount || 0}`);
    }

    console.log(`  ✅ Migration successful`);

    // Delete old image if flag is set
    if (DELETE_OLD) {
      console.log(`  Deleting from legacy bucket...`);
      const { error: deleteError } = await supabaseAdmin.storage
        .from(LEGACY_BUCKET)
        .remove([legacyPath]);

      if (deleteError) {
        console.log(`  ⚠️  Warning: Could not delete old image: ${deleteError.message}`);
      } else {
        console.log(`  🗑️  Deleted old image`);
      }
    }

    stats.successful++;
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Failed: ${errorMessage}`);
    stats.failed++;
    stats.errors.push({
      projectId: project.id,
      error: errorMessage,
    });
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PROJECT IMAGE MIGRATION: Legacy → 3-Bucket Architecture  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (DELETE_OLD && !DRY_RUN) {
    console.log('🗑️  DELETE OLD MODE - Legacy images will be removed after migration\n');
  }

  // Find projects that need migration (JOIN projects + project_data)
  console.log('Searching for projects to migrate...\n');
  const projectsToMigrate = await db
    .select({
      id: projects.id,
      name: projects.name,
      organization_id: projects.organization_id,
      project_image_url: project_data.project_image_url,
    })
    .from(projects)
    .innerJoin(project_data, eq(projects.id, project_data.project_id))
    .where(
      and(
        eq(projects.is_deleted, false),
        isNotNull(project_data.project_image_url),
        isNull(project_data.image_bucket)
      )
    );

  stats.total = projectsToMigrate.length;

  if (stats.total === 0) {
    console.log('✅ No projects to migrate. All projects are up to date!\n');
    return;
  }

  console.log(`Found ${stats.total} project(s) to migrate:\n`);
  projectsToMigrate.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (${p.id})`);
  });
  console.log('');

  // Migrate each project
  for (const project of projectsToMigrate) {
    await migrateProjectImage(project);
    // Add small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    MIGRATION SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total projects:     ${stats.total}`);
  console.log(`✅ Successful:      ${stats.successful}`);
  console.log(`❌ Failed:          ${stats.failed}`);
  console.log(`⏭️  Skipped:         ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:\n');
    stats.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. Project ${err.projectId}: ${err.error}`);
    });
  }

  console.log('\n');

  if (DRY_RUN) {
    console.log('ℹ️  This was a dry run. Re-run without --dry-run to apply changes.');
  } else if (stats.successful > 0) {
    console.log('🎉 Migration complete! Your project images are now using the new 3-bucket architecture.');
    if (!DELETE_OLD) {
      console.log('\nℹ️  Old images are still in the legacy bucket.');
      console.log('   Run with --delete-old to remove them after verifying the migration.');
    }
  }
}

// Run migration
main()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(stats.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
