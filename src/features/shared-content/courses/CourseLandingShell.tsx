import { 
  HeroSection,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FeaturesSection,
  FAQSection,
  CTAFooter,
} from '@/features/learning';
import type { CoursesMode } from './types';
import { CourseStickyCardWithMode } from './components/CourseStickyCardWithMode';

interface CourseLandingShellProps {
  mode: CoursesMode;
  course: any;
  modules: any[];
  faqs: any[];
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
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          <InstructorSection course={course} />
          <ModulesSection 
            modules={modules} 
            title={landingSections?.modules?.title}
            subtitle={landingSections?.modules?.subtitle}
            description={landingSections?.modules?.description}
          />
          <LessonsSection modules={modules} />
          <FeaturesSection course={course} />
          <FAQSection 
            faqs={faqs}
            title={landingSections?.faq?.title}
            subtitle={landingSections?.faq?.subtitle}
            description={landingSections?.faq?.description}
          />
          <CTAFooter course={course} />
        </div>
      </main>
    </div>
  );
}
