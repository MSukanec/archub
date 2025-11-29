import { useLocation } from 'wouter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { 
  useCourseLanding, 
  useCourseEnrollment,
  useCourseProgress,
  HeroSection,
  CourseStickyCard,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FeaturesSection,
  FAQSection,
  CTAFooter,
} from '@/features/learning';
import type { CoursesMode } from './types';

interface CourseLandingShellProps {
  mode: CoursesMode;
  slug: string;
}

export function CourseLandingShell({ mode, slug }: CourseLandingShellProps) {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug);
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);

  const isEnrolled = enrollmentData?.isEnrolled || false;
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Curso no encontrado</h1>
          <p className="text-muted-foreground">
            El curso que buscas no existe o no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const { course, modules, faqs, stats } = data;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <StickyCardWrapper course={course} stats={stats} isEnrolled={isEnrolled} progressPercentage={progressPercentage} mode={mode} />
      
      <main className="overflow-x-hidden">
        <HeroSection 
          course={course} 
          stats={stats} 
          isEnrolled={isEnrolled} 
          progressPercentage={progressPercentage} 
        />
        
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
      </main>
    </div>
  );
}

interface StickyCardWrapperProps {
  course: any;
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  mode: CoursesMode;
}

function StickyCardWrapper({ course, stats, isEnrolled, progressPercentage, mode }: StickyCardWrapperProps) {
  const rightOffset = mode === 'dashboard' 
    ? 'max(32px, calc((100vw - 1472px) / 2 - 72px))'
    : 'max(32px, calc((100vw - 1472px) / 2))';
  
  return (
    <div 
      className="hidden lg:block fixed top-24 z-40"
      style={{
        width: '368px',
        right: rightOffset
      }}
    >
      <div className="sticky top-24">
        <CourseStickyCard 
          course={course} 
          stats={stats} 
          isEnrolled={isEnrolled} 
          progressPercentage={progressPercentage} 
        />
      </div>
    </div>
  );
}
