import { useParams } from 'wouter';
import { MarketingLayout } from '@/layouts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { 
  useCourseLanding, 
  useCourseEnrollment,
  useCourseProgress,
  HeroSection,
  CourseStickyCard,
} from '@/features/learning';
import { CourseLandingContent } from '@/features/shared-content/courses';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
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

  const { course, stats } = data;

  const seoProps = {
    title: `${course.title} - Curso Online | Seencel`,
    description: course.short_description || '',
    keywords: (course.seo_keywords || []).join(', '),
    ogImage: course.og_image_url || course.cover_url || '',
  };

  const isEnrolled = enrollmentData?.isEnrolled || false;

  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  const stickyContent = <CourseStickyCard course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} />;
  const heroSection = <HeroSection course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} />;

  return (
    <MarketingLayout 
      seo={seoProps}
      stickyContent={stickyContent}
      heroSlot={heroSection}
    >
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

      <CourseLandingContent mode="public" slug={slug || ''} />
    </MarketingLayout>
  );
}
