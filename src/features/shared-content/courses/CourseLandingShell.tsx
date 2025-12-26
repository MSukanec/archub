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
  FoundersPromoSection,
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
        
        {!isEnrolled && (
          <FoundersPromoSection 
            mode={mode}
            coursePrice={course.price}
          />
        )}
        
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
  description?: string;
}

function ClientsSection({ 
  images, 
  title = "TRABAJOS REALIZADOS",
  subtitle = "ALGUNOS DE NUESTROS CLIENTES",
  description = "Nuestro enfoque no es solo teórico: está basado en la práctica profesional real. En esta sección podés ver algunos de los proyectos desarrollados por nuestro estudio y por alumnos que aplicaron directamente lo aprendido en el curso. Modelados completos, documentación ejecutiva, detalles BIM y cómputos generados íntegramente en ArchiCAD."
}: ClientsSectionProps) {
  const carouselItems = images.map((img) => ({
    id: img.id,
    src: img.url,
    alt: 'Proyecto realizado',
  }));

  return (
    <section className="py-16 sm:py-20" data-testid="section-clients">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid: content + fixed 400px space for sticky card */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          <div className="space-y-12">
            <div className="mb-12 space-y-4 text-left">
              <p className="text-xs sm:text-sm md:text-base uppercase tracking-wide font-semibold text-accent dark:text-accent">
                {subtitle}
              </p>
              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-tight text-foreground">
                {title}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg max-w-3xl leading-relaxed text-muted-foreground">
                Nuestro enfoque no es solo teórico: está basado en la práctica profesional real.
              </p>
              <p className="text-sm sm:text-base lg:text-lg max-w-3xl leading-relaxed text-muted-foreground">
                En esta sección podés ver algunos de los <span className="text-accent font-medium">proyectos desarrollados por nuestro estudio</span> y por alumnos que aplicaron directamente lo aprendido en el curso. Modelados completos, documentación ejecutiva, detalles BIM y cómputos generados íntegramente en ArchiCAD.
              </p>
            </div>
          </div>
          {/* Empty Space for sticky card */}
          <div className="hidden xl:block" />
        </div>
      </div>
      
      <div className="w-full overflow-hidden mt-8">
        <InfiniteCarousel
          items={carouselItems}
          direction="left"
          speed={30}
          height={700}
          visibleItems={5}
          gap={0}
          pauseOnHover={true}
        />
      </div>
    </section>
  );
}
