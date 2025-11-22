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

  return (
    <CourseLandingLayout 
      variant="public" 
      headerNavigation={navigationLinks}
      seo={seoProps}
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
      <div className="space-y-0">
        <HeroSection course={course} stats={stats} />
        <InstructorSection course={course} />
        <ModulesSection modules={modules} />
        <FeaturesSection course={course} />
        <FAQSection faqs={faqs} />
        <CTAFooter course={course} />
      </div>
    </CourseLandingLayout>
  );
}
