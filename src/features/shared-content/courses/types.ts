export type CoursesMode = 'public' | 'dashboard';

export type CourseCatalogTab = 'all' | 'enrolled' | 'completed';

export interface CoursesCatalogContentProps {
  mode: CoursesMode;
  showTabs?: boolean;
}
