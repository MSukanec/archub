import { useParams } from 'wouter';
import { useEffect } from 'react';
import { Layout as DashboardLayout } from '@/layouts/dashboard/DashboardLayout';
import { 
  HeroSection,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FAQSection,
  CTAFooter,
} from '@/features/learning';
import { useCourseLandingView } from '@/features/learning/views/CourseLandingView';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { 
    course, 
    modules, 
    faqs, 
    stats,
    isEnrolled, 
    progressPercentage,
    isLoading, 
    error,
  } = useCourseLandingView(slug);

  const seoTitle = course ? `${course.title} - Curso Online | Seencel` : '';

  useEffect(() => {
    document.title = seoTitle;
  }, [seoTitle]);

  if (isLoading) {
    return (
      <DashboardLayout wide>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout wide>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Curso no encontrado</h1>
            <p className="text-muted-foreground">
              El curso que buscas no existe o no está disponible.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout wide>
      <div className="h-full overflow-y-auto">
        {/* Landing Sections */}
        <div className="space-y-0">
          <HeroSection course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} />
          <InstructorSection course={course} />
          <ModulesSection modules={modules} />
          <LessonsSection modules={modules} />
          <FAQSection faqs={faqs} />
          <CTAFooter course={course} />
        </div>
      </div>
    </DashboardLayout>
  );
}
