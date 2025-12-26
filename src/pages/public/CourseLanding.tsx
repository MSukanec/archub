import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCourseLanding, useCourseEnrollment, useCourseProgress } from '@/features/learning';
import { CourseLandingShell } from '@/features/shared-content/courses';
import { Header } from '@/layouts/marketing/components/Header';
import { Footer } from '@/layouts/marketing/components/Footer';
export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);
  const isEnrolled = enrollmentData?.isEnrolled || false;
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth'});
  }, [location]);
  useEffect(() => {
    if (!data?.course) return;
    
    const course = data.course;
    const seo = {
      title: `${course.title} - Curso Online | Seencel`,
      description: course.short_description || '',
      keywords: (course.seo_keywords || []).join(', '),
      ogImage: course.og_image_url || course.cover_url || '',
    };
    const originalTitle = document.title;
    document.title = seo.title;
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
      }
    };
    setMetaTag("og:title", seo.title);
    setMetaTag("og:description", seo.description);
    setMetaTag("og:type", "website");
    if (seo.ogImage) setMetaTag("og:image", seo.ogImage);
    return () => {
      document.title = originalTitle;
    };
  }, [data]);
  const handleCTAClick = () => {
    if (isEnrolled) {
      navigate(`/learning/courses/${data?.course?.slug}`);
    } else if (userData?.user) {
      navigate(`/checkout?course=${data?.course?.slug}`);
    } else {
      navigate('/register');
    }
  };
  const ctaButtonText = isEnrolled ? 'CONTINUAR CURSO': 'INSCRIBIRME';
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Header />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: data.course.title,
            description: data.course.short_description,
            provider: {
              '@type': 'Organization',
              name: 'Seencel',
              url: 'https://seencel.com',
            },
            ...(data.course.instructor_name && {
              instructor: {
                '@type': 'Person',
                name: data.course.instructor_name,
              },
            }),
            ...(data.course.price && {
              offers: {
                '@type': 'Offer',
                price: data.course.price,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
            }),
            educationalLevel: 'Beginner to Advanced',
            inLanguage: 'es',
            numberOfCredits: data.stats.total_lessons,
            timeRequired: `PT${data.stats.total_duration_hours}H`,
          }),
        }}
      />
      
      <CourseLandingShell 
        mode="public" 
        course={data.course}
        modules={data.modules}
        faqs={data.faqs}
        testimonials={data.testimonials}
        stats={data.stats}
        isEnrolled={isEnrolled}
        progressPercentage={progressPercentage}
        onCTAClick={handleCTAClick}
        ctaButtonText={ctaButtonText}
        clientGallery={data.clientGallery}
      />
      
      <Footer />
    </div>
  );
}
