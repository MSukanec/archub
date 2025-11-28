import { useParams } from 'wouter';
import { MarketingLayout } from '@/layouts';
import { 
  useCourseLanding, 
  useCourseEnrollment,
  useCourseProgress,
  HeroSection,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FeaturesSection,
  FAQSection,
  CTAFooter,
  CourseStickyCard,
} from '@/features/learning';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id || '');
  const { data: progressData } = useCourseProgress(data?.course?.id);

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  if (error || !data) {
    return (
      <MarketingLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  const { course, modules, faqs, stats } = data;

  // SEO metadata
  const seoProps = {
    title: `${course.title} - Curso Online | Seencel`,
    description: course.short_description || '',
    keywords: (course.seo_keywords || []).join(', '),
    ogImage: course.og_image_url || course.cover_url || '',
  };

  // Check if user is enrolled
  const isEnrolled = enrollmentData?.isEnrolled || false;

  // Calculate progress percentage
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  // Sticky sidebar content (shown in desktop only)
  const stickyContent = <CourseStickyCard course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} />;
  
  // Full-width hero section
  const heroSection = <HeroSection course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} />;

  return (
    <MarketingLayout 
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
            description: course.short_description,
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
        <ModulesSection 
          modules={modules} 
          title={(course.landing_sections as any)?.modules?.title}
          subtitle={(course.landing_sections as any)?.modules?.subtitle}
          description={(course.landing_sections as any)?.modules?.description}
        />
        <LessonsSection modules={modules} />
        <FeaturesSection course={course} />
        <FAQSection 
          faqs={faqs}
          title={(course.landing_sections as any)?.faq?.title}
          subtitle={(course.landing_sections as any)?.faq?.subtitle}
          description={(course.landing_sections as any)?.faq?.description}
        />
        <CTAFooter course={course} />
      </div>
    </MarketingLayout>
  );
}
