import type { Course, CourseModule, Lesson, CourseFaq } from '@shared/schema';

export interface CourseLandingData {
  course: Course;
  modules: ModuleWithLessons[];
  faqs: CourseFaq[];
  stats: CourseStats;
}

export interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
  total_duration_min: number;
}

export interface CourseStats {
  total_modules: number;
  total_lessons: number;
  total_duration_hours: number;
  total_duration_formatted: string;
}
