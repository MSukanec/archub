import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { HeroLayout } from "@/layouts/dashboard/HeroLayout";
import { CourseLandingShell } from '@/features/shared-content/courses/CourseLandingShell';
import { useCourseLanding, useCourseEnrollment, useCourseProgress } from '@/features/learning';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

export default function CourseInfo() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);

  const isEnrolled = enrollmentData?.isEnrolled || false;
  const progressPercentage = (() => {
    if (!isEnrolled || !progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  const handleCTAClick = () => {
    if (isEnrolled) {
      // Usuario inscrito → ir al curso
      navigate(`/learning/courses/${data?.course?.slug}`);
    } else if (userData?.user) {
      // Usuario logueado pero NO inscrito → ir a checkout
      navigate(`/checkout?course=${data?.course?.slug}`);
    } else {
      // Usuario no logueado → ir a registro
      navigate('/register');
    }
  };

  const ctaButtonText = isEnrolled 
    ? (progressPercentage > 0 ? 'CONTINUAR CURSO' : 'VER CURSO')
    : 'INSCRIBIRME AHORA';

  if (isLoading) {
    return (
      <Layout hideHeader wide>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout hideHeader wide>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader wide>
      <HeroLayout noPadding>
        <CourseLandingShell 
          mode="dashboard" 
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
      </HeroLayout>
    </Layout>
  );
}
