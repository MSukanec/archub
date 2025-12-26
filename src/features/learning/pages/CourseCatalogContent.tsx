/**
 * @deprecated Use CoursesCatalogContent from @/features/shared-content/courses instead
 * This file is kept for backward compatibility
 */
import { CoursesCatalogContent } from '@/features/shared-content/courses';
export type { CourseCatalogTab } from '@/features/shared-content/courses';

interface LegacyCourseCatalogContentProps {
  showTabs?: boolean;
}

export function CourseCatalogContent({ showTabs = true }: LegacyCourseCatalogContentProps) {
  return <CoursesCatalogContent mode="dashboard" showTabs={showTabs} />;
}
