import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BookOpen, Eye, Clock, CheckCircle, Lock } from 'lucide-react';
import { useCurrentUser } from '@/features/users/hooks';
import { useMultipleFeatureFlags } from '@/hooks/use-feature-flags';
import { BlockedRestricted } from '@/components/shared/restrictions';
import { ComingSoonCard } from '@/components/shared/restrictions/guards/ComingSoonCard';
import { 
  useCourseLanding, 
  useCourseEnrollment,
  useCourseProgress,
  InstructorSection,
  ModulesSection,
  LessonsSection,
  FAQSection,
} from '@/features/learning';
import { InfiniteCarousel } from '@/components/shared/InfiniteCarousel';
import type { CourseLandingContentProps } from './types';

export function CourseLandingContent({ mode, slug }: CourseLandingContentProps) {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data, isLoading, error } = useCourseLanding(slug);
  const { data: enrollmentData } = useCourseEnrollment(data?.course?.id, userData?.user?.id);
  const { data: progressData } = useCourseProgress(data?.course?.id);
  const { flags: featureFlags, isReady: flagsReady } = useMultipleFeatureFlags(['course_purchases_enabled'], true);

  const isEnrolled = enrollmentData?.isEnrolled || false;
  const progressPercentage = (() => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.is_completed).length;
    return Math.round((completed / progressData.length) * 100);
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Curso no encontrado</h1>
          <p className="text-muted-foreground">
            El curso que buscas no existe o no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const { course, modules, faqs, stats, clientGallery } = data;

  const isCourseDisabled = course.is_active === false;
  const isPurchasesDisabled = flagsReady && !featureFlags.course_purchases_enabled;
  const isCheckoutBlocked = !isEnrolled && (isCourseDisabled || isPurchasesDisabled);

  const handleCTAClick = () => {
    // Block checkout if course is disabled or purchases disabled
    if (!isEnrolled && (course.is_active === false || isPurchasesDisabled)) {
      return;
    }
    
    if (isEnrolled) {
      // Usuario inscrito → ir al curso
      navigate(`/learning/courses/${course.slug}`);
    } else if (userData?.user) {
      // Usuario logueado pero NO inscrito → ir a checkout
      navigate(`/checkout?course=${course.slug}`);
    } else {
      // Usuario no logueado → ir a registro
      navigate('/register');
    }
  };

  // Texto del botón según estado de inscripción
  const ctaButtonText = isEnrolled 
    ? (progressPercentage > 0 ? 'Continuar Curso' : 'Ver Curso')
    : 'Inscribirme Ahora';

  return (
    <>
      {mode === 'dashboard' && (
        <DashboardCourseHeader 
          course={course}
          stats={stats}
          isEnrolled={isEnrolled}
          progressPercentage={progressPercentage}
          onCTAClick={handleCTAClick}
          ctaButtonText={ctaButtonText}
          isCheckoutBlocked={isCheckoutBlocked}
        />
      )}
      
      <div className={mode === 'dashboard' ? "space-y-8" : "container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16"}>
        <InstructorSection course={course} />
        <ModulesSection 
          modules={modules} 
          title={(course.landing_sections as any)?.modules?.title}
          subtitle={(course.landing_sections as any)?.modules?.subtitle}
          description={(course.landing_sections as any)?.modules?.description}
        />
        <LessonsSection modules={modules} />
        <FAQSection 
          faqs={faqs}
          title={(course.landing_sections as any)?.faq?.title}
          subtitle={(course.landing_sections as any)?.faq?.subtitle}
          description={(course.landing_sections as any)?.faq?.description}
        />
        
        {clientGallery && clientGallery.length > 0 && (
          <ClientsSection 
            images={clientGallery}
            title={(course.landing_sections as any)?.clients?.title}
            subtitle={(course.landing_sections as any)?.clients?.subtitle}
          />
        )}
        
        {mode === 'public' && (
          <PublicCTAFooter 
            course={course}
            isEnrolled={isEnrolled}
            onCTAClick={handleCTAClick}
            ctaButtonText={ctaButtonText}
            isCheckoutBlocked={isCheckoutBlocked}
            isPurchasesDisabled={isPurchasesDisabled}
          />
        )}
        
        {mode === 'dashboard' && (
          <DashboardCTAFooter 
            onCTAClick={handleCTAClick}
            ctaButtonText={ctaButtonText}
            isCheckoutBlocked={isCheckoutBlocked}
            isPurchasesDisabled={isPurchasesDisabled}
          />
        )}
      </div>
    </>
  );
}

interface DashboardCourseHeaderProps {
  course: any;
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  onCTAClick: () => void;
  ctaButtonText: string;
  isCheckoutBlocked?: boolean;
}

function DashboardCourseHeader({ 
  course, 
  stats, 
  isEnrolled, 
  progressPercentage, 
  onCTAClick,
  ctaButtonText,
  isCheckoutBlocked = false
}: DashboardCourseHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg overflow-hidden mb-8">
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {course.cover_url && (
          <div className="lg:w-1/3 aspect-video lg:aspect-auto lg:h-48 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={course.cover_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{course.short_description}</p>
          </div>
          
          {isEnrolled && progressPercentage > 0 && (
            <div className="max-w-xs space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{stats.total_modules} Módulos</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>{stats.total_lessons} Lecciones</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{stats.total_duration_formatted}</span>
            </div>
          </div>
          
          <BlockedRestricted
            isBlocked={isCheckoutBlocked}
            title="Curso no disponible"
            message="Este curso no está disponible para inscripción en este momento."
          >
            <Button onClick={onCTAClick} className="gap-2" disabled={isCheckoutBlocked} data-testid="button-cta-header">
              {isCheckoutBlocked && <Lock className="w-4 h-4" />}
              <Eye className="w-4 h-4" />
              {ctaButtonText}
            </Button>
          </BlockedRestricted>
        </div>
      </div>
    </div>
  );
}

interface PublicCTAFooterProps {
  course: any;
  isEnrolled: boolean;
  onCTAClick: () => void;
  ctaButtonText: string;
  isCheckoutBlocked?: boolean;
  isPurchasesDisabled?: boolean;
}

function PublicCTAFooter({ course, isEnrolled, onCTAClick, ctaButtonText, isCheckoutBlocked = false, isPurchasesDisabled = false }: PublicCTAFooterProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isEnrolled ? '¿Listo para continuar?' : '¿Listo para comenzar?'}
          </h2>
          <p className="text-xl text-muted-foreground">
            {isEnrolled 
              ? 'Retoma tu aprendizaje donde lo dejaste'
              : 'Únete hoy y transforma tu forma de trabajar'
            }
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <ComingSoonCard status={!isEnrolled && isPurchasesDisabled ? 'maintenance' : 'available'}>
              <BlockedRestricted
                isBlocked={isCheckoutBlocked}
                title="Curso no disponible"
                message="Este curso no está disponible para inscripción en este momento."
              >
                <Button size="lg" className="px-8 text-lg" onClick={onCTAClick} disabled={isCheckoutBlocked}>
                  {isCheckoutBlocked && !isEnrolled && <Lock className="w-4 h-4 mr-2" />}
                  {ctaButtonText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </BlockedRestricted>
            </ComingSoonCard>
            {course.price && !isEnrolled && (
              <div className="text-center">
                <p className="text-3xl font-bold">${course.price}</p>
                <p className="text-sm text-muted-foreground">/ año</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isEnrolled 
              ? 'Tu progreso se guarda automáticamente'
              : 'Acceso inmediato • Sin compromisos • Contenido siempre disponible'
            }
          </p>
        </div>
      </div>
    </section>
  );
}

interface DashboardCTAFooterProps {
  onCTAClick: () => void;
  ctaButtonText: string;
  isCheckoutBlocked?: boolean;
  isPurchasesDisabled?: boolean;
}

function DashboardCTAFooter({ onCTAClick, ctaButtonText, isCheckoutBlocked = false, isPurchasesDisabled = false }: DashboardCTAFooterProps) {
  return (
    <div className="flex justify-center py-8">
      <ComingSoonCard status={isPurchasesDisabled ? 'maintenance' : 'available'}>
        <BlockedRestricted
          isBlocked={isCheckoutBlocked}
          title="Curso no disponible"
          message="Este curso no está disponible para inscripción en este momento."
        >
          <Button size="lg" onClick={onCTAClick} className="gap-2 px-8" disabled={isCheckoutBlocked} data-testid="button-cta-footer">
            {isCheckoutBlocked && <Lock className="w-4 h-4" />}
            <Eye className="w-5 h-5" />
            {ctaButtonText}
          </Button>
        </BlockedRestricted>
      </ComingSoonCard>
    </div>
  );
}

interface ClientsSectionProps {
  images: { id: string; url: string }[];
  title?: string;
  subtitle?: string;
}

function ClientsSection({ images, title, subtitle }: ClientsSectionProps) {
  const carouselItems = images.map((img) => ({
    id: img.id,
    src: img.url,
    alt: 'Cliente',
  }));

  return (
    <section className="space-y-8" data-testid="section-clients">
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {title || 'Nuestros Clientes'}
        </h2>
        {subtitle && (
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      
      <InfiniteCarousel
        items={carouselItems}
        direction="left"
        speed={40}
        height={120}
        visibleItems={6}
        gap={16}
        pauseOnHover={true}
      />
    </section>
  );
}
