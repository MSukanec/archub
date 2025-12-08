import { useParams } from 'wouter';
import { useEffect } from 'react';
import { Layout as DashboardLayout } from '@/layouts/dashboard/DashboardLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { 
  useCourseLanding,
  useCourseEnrollment,
  useCourseProgress,
  HeroSection,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FAQSection,
  CTAFooter,
} from '@/features/learning';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug || '');
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);

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

  if (error || !data) {
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

  const { course, modules, faqs, stats } = data;

  // SEO metadata
  const seoTitle = `${course.title} - Curso Online | Seencel`;
  const seoDescription = course.short_description || '';

  // Check if user is enrolled
  const isEnrolled = enrollmentData?.isEnrolled || false;

  // Calculate progress percentage
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  // Set page title (no OG tags needed in dashboard context)
  useEffect(() => {
    document.title = seoTitle;
  }, [seoTitle]);

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
