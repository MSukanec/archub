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
export { ModulesSection } from './landing/ModulesSection';
export { FeaturesSection } from './landing/FeaturesSection';
export { FAQSection } from './landing/FAQSection';
export { CTAFooter } from './landing/CTAFooter';
export { CourseCard } from './landing/CourseCard';
export { CourseGrid } from './landing/CourseGrid';
export { CourseStickyCard } from './landing/CourseStickyCard';
export { SectionHeader } from './landing/SectionHeader';

// ========== DASHBOARD COMPONENTS (STUDENT) ==========
export { default as CourseHeroImageUpload } from './dashboard/CourseHeroImageUpload';
export { FavoriteButton } from './dashboard/FavoriteButton';
export { LessonMarkers } from './dashboard/LessonMarkers';
export { LessonNotes } from './dashboard/LessonNotes';
export { LessonSummaryNote } from './dashboard/LessonSummaryNote';
export { default as PayButton } from './dashboard/PayButton';
export { DiscordWidget } from './dashboard/DiscordWidget';
