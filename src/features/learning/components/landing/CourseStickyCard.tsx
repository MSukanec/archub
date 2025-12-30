import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, CheckCircle, MessageCircle, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMultipleFeatureFlags } from '@/hooks/use-feature-flags';
import { BlockedRestricted } from '@/components/shared/restrictions';
import { ComingSoonCard } from '@/components/shared/restrictions/guards/ComingSoonCard';
import type { Course } from '@shared/schema';
import type { CourseStats } from '../../types';

interface CourseStickyCardProps {
  course: Course;
  stats: CourseStats;
  isEnrolled?: boolean;
  progressPercentage?: number;
}

export function CourseStickyCard({ course, stats, isEnrolled = false, progressPercentage = 0 }: CourseStickyCardProps) {
  const user = useAuthStore((state) => state.user);
  const [, navigate] = useLocation();
  const { flags: featureFlags, isReady: flagsReady } = useMultipleFeatureFlags(['course_purchases_enabled'], true);

  // Block checkout if course is disabled OR feature flag is disabled (FOR EVERYONE, including admins)
  const isCourseDisabled = course.is_active === false;
  const isPurchasesDisabled = flagsReady && !featureFlags.course_purchases_enabled;
  const isCheckoutBlocked = !isEnrolled && (isCourseDisabled || isPurchasesDisabled);

  // Determine button state and action
  const handleCTAClick = useCallback(() => {
    // Don't allow checkout if course is disabled or purchases disabled
    if (!isEnrolled && (course.is_active === false || isPurchasesDisabled)) {
      return;
    }
    
    if (isEnrolled) {
      // User is enrolled - go to course view
      navigate(`/learning/courses/${course.slug}`);
    } else if (user) {
      // User is logged in but not enrolled - go to checkout
      navigate(`/checkout?course=${course.slug}`);
    } else {
      // User is not logged in - go to register
      navigate('/register');
    }
  }, [isEnrolled, user, course.slug, navigate, course.is_active, isPurchasesDisabled]);

  // Determine button text and variant
  const buttonText = isEnrolled ? 'CONTINUAR CURSO' : 'INSCRIBIRME';
  const buttonVariant = isEnrolled ? 'default' : 'default';

  return (
    <Card className="overflow-hidden shadow-xl border-2" data-testid="card-course-sticky">
      {/* Course Image */}
      {course.cover_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-6 space-y-6">
        {/* Course Title */}
        <div>
          <h3 className="font-bold text-xl" data-testid="text-course-title">
            {course.title}
          </h3>
        </div>

        {/* Progress Bar - Only show when enrolled */}
        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
          </div>
        )}

        {/* Price */}
        {course.price && !isEnrolled && (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary" data-testid="text-course-price">
                ${course.price}
              </span>
              <span className="text-sm text-muted-foreground">/ año</span>
            </div>
          </div>
        )}

        {/* Course Stats */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-modules">{stats.total_modules} Módulos</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-lessons">{stats.total_lessons} Lecciones</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-duration">{stats.total_duration_formatted} de Contenido</span>
          </div>
        </div>

        {/* Additional Features */}
        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Certificado de Curso</span>
          </div>
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Foro de Consultas Privado</span>
          </div>
          {course.instructor_name && (
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Avalado por {course.instructor_name}</span>
            </div>
          )}
        </div>

        {/* CTA Button - Only ONE button shown at a time */}
        <div className="pt-2">
          <ComingSoonCard status={!isEnrolled && isPurchasesDisabled ? 'maintenance' : 'available'}>
            <BlockedRestricted
              isBlocked={isCheckoutBlocked}
              title="Curso no disponible"
              message="Este curso no está disponible para inscripción en este momento."
            >
              <Button 
                size="lg" 
                variant={buttonVariant}
                className="w-full text-base font-semibold"
                onClick={handleCTAClick}
                disabled={isCheckoutBlocked}
                data-testid={isEnrolled ? "button-continue" : "button-enroll"}
              >
                {isCheckoutBlocked && !isEnrolled && <Lock className="w-4 h-4 mr-2" />}
                {buttonText}
              </Button>
            </BlockedRestricted>
          </ComingSoonCard>
        </div>
      </CardContent>
    </Card>
  );
}
