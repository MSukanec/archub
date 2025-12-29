import { useEffect } from 'react';
import { useParams } from 'wouter';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { HeroLayout } from "@/layouts/dashboard/HeroLayout";
import { CourseLandingShell } from '@/features/shared-content/courses/CourseLandingShell';
import { useCourseLandingView } from '@/features/learning/views/CourseLandingView';
import { useNavigationStore } from '@/stores/navigationStore';

export default function PrivateCourseLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { 
    course, 
    modules, 
    faqs, 
    testimonials, 
    stats, 
    clientGallery,
    isEnrolled, 
    progressPercentage, 
    ctaButtonText, 
    isLoading, 
    error,
    handleCTAClick 
  } = useCourseLandingView(slug);

  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

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

  if (error || !course) {
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
          course={course}
          modules={modules}
          faqs={faqs}
          testimonials={testimonials}
          stats={stats}
          isEnrolled={isEnrolled}
          progressPercentage={progressPercentage}
          onCTAClick={handleCTAClick}
          ctaButtonText={ctaButtonText}
          clientGallery={clientGallery}
        />
      </HeroLayout>
    </Layout>
  );
}
