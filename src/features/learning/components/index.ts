/**
 * Learning Components - Barrel Export
 * 
 * Componentes UI del módulo learning organizados por contexto:
 * - Landing: Componentes para páginas públicas
 * - Dashboard: Componentes para estudiantes
 */

// ========== LANDING COMPONENTS (PUBLIC) ==========
export { HeroSection } from './landing/HeroSection';
export { InstructorSection } from './landing/InstructorSection';
export { PlatformSection } from './landing/PlatformSection';
export { ModulesSection } from './landing/ModulesSection.tsx';
export { LessonsSection } from './landing/LessonsSection';
export { CourseDetailsSection } from './landing/CourseDetailsSection';
export { FAQSection } from './landing/FAQSection';
export { TestimonialsSection } from './landing/TestimonialsSection';
export { CTAFooter } from './landing/CTAFooter';
export { CourseCard } from './landing/CourseCard';
export { CourseGrid } from './landing/CourseGrid';
export { CourseStickyCard } from './landing/CourseStickyCard';
export { SectionHeader } from './landing/SectionHeader';
export { FoundersPromoSection } from './landing/FoundersPromoSection';

// ========== UNIFIED COMPONENTS (PUBLIC + DASHBOARD) ==========
export { UnifiedCourseCard } from './UnifiedCourseCard';
export { UnifiedCourseGrid } from './UnifiedCourseGrid';

// ========== DASHBOARD COMPONENTS (STUDENT) ==========
export { default as CourseHeroImageUpload } from './dashboard/CourseHeroImageUpload';
export { FavoriteButton } from './dashboard/FavoriteButton';
export { LessonMarkers } from './dashboard/LessonMarkers';
export { CourseMarkers } from './dashboard/CourseMarkers';
export { CourseMarkersSimple } from './dashboard/CourseMarkersSimple';
export { LessonNotes } from './dashboard/LessonNotes';
export { LessonSummaryNote } from './dashboard/LessonSummaryNote';
export { default as PayButton } from './dashboard/PayButton';
export { DiscordWidget } from './dashboard/DiscordWidget';

// ========== LAYOUT/SHARED COMPONENTS ==========
export { FloatingCourseLessons } from './FloatingCourseLessons';
export { default as LessonRow } from './LessonRow';
export { default as AdminCourseStudentRow } from './admin/AdminCourseStudentRow';

// ========== CONTENT EXPLORER COMPONENTS ==========
export { ContentHeader, ModuleSection, LessonItem } from './content';

// ========== PLAYER COMPONENTS ==========
export { PlayerDrawer, CoursePlayerDrawerHost } from './player';
