import { useParams } from 'wouter';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
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

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const { course, modules, faqs, stats } = data;

  // SEO metadata
  const seoTitle = `${course.title} - Curso Online | Seencel`;
  const seoDescription = course.short_description || course.long_description || '';
  const seoKeywords = (course.seo_keywords || []).join(', ');
  const ogImage = course.og_image_url || course.cover_url || '';

  return (
    <PublicLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Características", href: "/#features" },
        { label: "Capacidades", href: "/#capabilities" }
      ]}
      seo={{
        title: seoTitle,
        description: seoDescription,
        ogTitle: seoTitle,
        ogDescription: seoDescription,
        keywords: seoKeywords || undefined,
        ogImage: ogImage || undefined,
        twitterImage: ogImage || undefined,
      }}
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
    </PublicLayout>
  );
}
