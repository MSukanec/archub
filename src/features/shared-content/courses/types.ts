export type CoursesMode = 'public'| 'dashboard';
export type CourseCatalogTab = 'all'| 'enrolled'| 'completed';
export interface CoursesCatalogContentProps {
  mode: CoursesMode;
  showTabs?: boolean;
}
export interface CourseLandingContentProps {
  mode: CoursesMode;
  slug: string;
}
export interface CourseLandingData {
  course: any;
  modules: any[];
  faqs: any[];
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
}
