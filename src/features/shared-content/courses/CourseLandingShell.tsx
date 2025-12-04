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
import { InfiniteCarousel } from '@/components/shared/InfiniteCarousel';
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
  clientGallery?: { id: string; url: string }[];
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
  clientGallery,
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
        
        {clientGallery && clientGallery.length > 0 && (
          <ClientsSection 
            images={clientGallery}
            title={landingSections?.clients?.title}
            subtitle={landingSections?.clients?.subtitle}
          />
        )}
        
        {!isEnrolled && <CTAFooter course={course} />}
      </main>
    </div>
  );
}

interface ClientsSectionProps {
  images: { id: string; url: string }[];
  title?: string;
  subtitle?: string;
}

function ClientsSection({ images, title, subtitle }: ClientsSectionProps) {
  const carouselItems = images.map((img) => ({
    id: img.id,
    src: img.url,
    alt: 'Cliente',
  }));

  return (
    <section className="py-16 bg-muted/30" data-testid="section-clients">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {title || 'Nuestros Clientes'}
          </h2>
          {subtitle && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        
        <InfiniteCarousel
          items={carouselItems}
          direction="left"
          speed={40}
          height={120}
          visibleItems={6}
          gap={16}
          pauseOnHover={true}
        />
      </div>
    </section>
  );
}
