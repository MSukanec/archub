import { 
  HeroSection,
  InstructorSection,
  PlatformSection,
  ModulesSection,
  LessonsSection,
  CourseDetailsSection,
  FAQSection,
  TestimonialsSection,
  CTAFooter,
} from '@/features/learning';
import type { CoursesMode } from './types';
import { CourseStickyCardWithMode } from './components/CourseStickyCardWithMode';
import type { Testimonial } from '@shared/schema';

interface CourseLandingShellProps {
  mode: CoursesMode;
  course: any;
  modules: any[];
  faqs: any[];
  testimonials: Testimonial[];
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  onCTAClick: () => void;
  ctaButtonText: string;
}

export function CourseLandingShell({ 
  mode, 
  course, 
  modules, 
  faqs, 
  testimonials,
  stats, 
  isEnrolled, 
  progressPercentage,
  onCTAClick,
  ctaButtonText,
}: CourseLandingShellProps) {
  if (!course || !stats) {
    return null;
  }
  
  const landingSections = (course.landing_sections as any) || {};
  
  return (
    <div className="min-h-screen overflow-x-hidden">
      <CourseStickyCardWithMode 
        mode={mode}
        course={course} 
        stats={stats} 
        isEnrolled={isEnrolled} 
        progressPercentage={progressPercentage}
        onCTAClick={onCTAClick}
        ctaButtonText={ctaButtonText}
      />
      
      <main className="overflow-x-hidden">
        <HeroSection 
          course={course} 
          stats={stats} 
          isEnrolled={isEnrolled} 
          progressPercentage={progressPercentage} 
        />
        
        <InstructorSection course={course} />
        <PlatformSection />
        <ModulesSection 
          modules={modules} 
          title={landingSections?.modules?.title}
          subtitle={landingSections?.modules?.subtitle}
          description={landingSections?.modules?.description}
        />
        <LessonsSection modules={modules} />
        <CourseDetailsSection course={course} />
        <TestimonialsSection 
          testimonials={testimonials}
          title={landingSections?.testimonials?.title}
          subtitle={landingSections?.testimonials?.subtitle}
          description={landingSections?.testimonials?.description}
        />
        <FAQSection 
          faqs={faqs}
          title={landingSections?.faq?.title}
          subtitle={landingSections?.faq?.subtitle}
          description={landingSections?.faq?.description}
        />
        {!isEnrolled && <CTAFooter course={course} />}
      </main>
    </div>
  );
}
