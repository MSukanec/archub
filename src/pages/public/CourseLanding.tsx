import { useParams } from 'wouter';
import { CourseLandingLayout } from '@/layout/course-landing';
import { useCourseLanding } from '@/features/course-landing';
import {
  HeroSection,
  InstructorSection,
  ModulesSection,
  FeaturesSection,
  FAQSection,
  CTAFooter,
  CourseStickyCard,
} from '@/features/course-landing/components';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCourseLanding(slug || '');

  const navigationLinks = [
    { label: "Cursos", href: "/cursos" },
    { label: "Características", href: "/#features" },
    { label: "Capacidades", href: "/#capabilities" }
  ];

  if (isLoading) {
    return (
      <CourseLandingLayout variant="public" headerNavigation={navigationLinks}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </CourseLandingLayout>
    );
  }

  if (error || !data) {
    return (
      <CourseLandingLayout variant="public" headerNavigation={navigationLinks}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
      </CourseLandingLayout>
    );
  }

  const { course, modules, faqs, stats } = data;

  // SEO metadata
  const seoProps = {
    title: `${course.title} - Curso Online | Seencel`,
    description: course.short_description || course.long_description || '',
    keywords: (course.seo_keywords || []).join(', '),
    ogImage: course.og_image_url || course.cover_url || '',
  };

  // Sticky sidebar content (shown in desktop only)
  const stickyContent = <CourseStickyCard course={course} stats={stats} />;
  
  // Full-width hero section
  const heroSection = <HeroSection course={course} stats={stats} />;

  return (
    <CourseLandingLayout 
      variant="public" 
      headerNavigation={navigationLinks}
      seo={seoProps}
      stickyContent={stickyContent}
      heroSlot={heroSection}
    >
      {/* Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: course.title,
            description: course.short_description || course.long_description,
            provider: {
              '@type': 'Organization',
              name: 'Seencel',
              url: 'https://seencel.com',
            },
            ...(course.instructor_name && {
              instructor: {
                '@type': 'Person',
                name: course.instructor_name,
              },
            }),
            ...(course.price && {
              offers: {
                '@type': 'Offer',
                price: course.price,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
            }),
            educationalLevel: 'Beginner to Advanced',
            inLanguage: 'es',
            numberOfCredits: stats.total_lessons,
            timeRequired: `PT${stats.total_duration_hours}H`,
          }),
        }}
      />

      {/* Landing Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <InstructorSection course={course} />
        <ModulesSection modules={modules} />
        <FeaturesSection course={course} />
        <FAQSection faqs={faqs} />
        <CTAFooter course={course} />
      </div>
    </CourseLandingLayout>
  );
}
