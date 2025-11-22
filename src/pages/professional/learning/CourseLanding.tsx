import { useParams } from 'wouter';
import { useEffect } from 'react';
import { CourseLandingLayout } from '@/layout/course-landing';
import { 
  useCourseLanding,
  HeroSection,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FeaturesSection,
  FAQSection,
  CTAFooter,
} from '@/features/learning';

export default function CourseLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCourseLanding(slug || '');

  if (isLoading) {
    return (
      <CourseLandingLayout variant="dashboard">
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
      <CourseLandingLayout variant="dashboard">
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
  const seoTitle = `${course.title} - Curso Online | Seencel`;
  const seoDescription = course.short_description || '';

  // Set page title (no OG tags needed in dashboard context)
  useEffect(() => {
    document.title = seoTitle;
  }, [seoTitle]);

  return (
    <CourseLandingLayout variant="dashboard">
      {/* Landing Sections */}
      <div className="space-y-0">
        <HeroSection course={course} stats={stats} />
        <InstructorSection course={course} />
        <ModulesSection modules={modules} />
        <LessonsSection modules={modules} />
        <FeaturesSection course={course} />
        <FAQSection faqs={faqs} />
        <CTAFooter course={course} />
      </div>
    </CourseLandingLayout>
  );
}
