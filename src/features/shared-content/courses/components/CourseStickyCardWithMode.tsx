import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, CheckCircle, MessageCircle, Shield } from 'lucide-react';
import { BlockedRestricted, ComingSoonCard } from '@/components/shared/restrictions';
import type { CoursesMode } from '../types';
import type { ItemStatus } from '@shared/schema';

interface CourseStickyCardWithModeProps {
  mode: CoursesMode;
  course: any;
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  onCTAClick: () => void;
  ctaButtonText: string;
  variant?: 'fixed' | 'in-grid';
}

export function CourseStickyCardWithMode({ 
  mode,
  course, 
  stats, 
  isEnrolled, 
  progressPercentage,
  onCTAClick,
  ctaButtonText,
  variant = 'fixed',
}: CourseStickyCardWithModeProps) {
  const status = (course.status || 'available') as ItemStatus;
  
  // When in-grid, the card is positioned by the parent grid, no fixed positioning needed
  if (variant === 'in-grid') {
    return (
      <ComingSoonCard status={status}>
        <Card className="overflow-hidden shadow-xl border-2" data-testid="card-course-sticky">
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
            <div>
              <h3 className="font-bold text-xl" data-testid="text-course-title">
                {course.title}
              </h3>
            </div>

            {isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
              </div>
            )}

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

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Certificado de Curso</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Foro de Consultas Privado</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Avalado por Graphisoft Argentina</span>
              </div>
            </div>

            <div className="pt-2">
              <BlockedRestricted 
                isBlocked={!isEnrolled && course.is_active === false}
                title="Curso no disponible"
                message="Este curso no está disponible para inscripción en este momento."
              >
                <Button 
                  size="lg" 
                  className="w-full text-base font-semibold"
                  onClick={onCTAClick}
                  data-testid={isEnrolled ? "button-continue" : "button-enroll"}
                >
                  {ctaButtonText}
                </Button>
              </BlockedRestricted>
            </div>
          </CardContent>
        </Card>
      </ComingSoonCard>
    );
  }
  
  // Fixed variant - position fixed with calculated offset
  // 
  // The card must align with the right edge of the content area inside the container.
  // Container max-width at xl: 1280px, at 2xl: 1536px
  // Container has px-4 sm:px-6 lg:px-8 padding (32px at lg+)
  // 
  // Grid layout: [1fr_400px] reserves 400px column for the card
  // Card is 368px wide, so we add 16px margin to center it in the 400px column
  // 
  // Formula for right offset:
  // right = (viewport - container_max_width) / 2 + container_padding + card_margin
  //       = (100vw - 1280px) / 2 + 32px + 16px
  //       = (100vw - 1280px) / 2 + 48px
  // 
  // For dashboard mode, the sidebar takes 72px, reducing effective viewport
  // Dashboard formula: (100vw - 72px - 1280px) / 2 + 48px
  
  // Use CSS clamp to handle both xl (1280px) and 2xl (1536px) breakpoints
  // At exactly 1280px viewport: offset should be 32px (padding) + 16px (margin) = 48px
  // As viewport grows, the offset grows proportionally
  const fixedRightOffset = mode === 'dashboard' 
    ? 'max(48px, calc((100vw - 72px - 1280px) / 2 + 48px))'
    : 'max(48px, calc((100vw - 1280px) / 2 + 48px))';
  
  return (
    <div 
      className="hidden xl:block fixed top-24 z-40"
      style={{
        width: '368px',
        right: fixedRightOffset
      }}
    >
      <div className="sticky top-24">
        <ComingSoonCard status={status}>
          <Card className="overflow-hidden shadow-xl border-2" data-testid="card-course-sticky">
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
            <div>
              <h3 className="font-bold text-xl" data-testid="text-course-title">
                {course.title}
              </h3>
            </div>

            {isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
              </div>
            )}

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

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Certificado de Curso</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Foro de Consultas Privado</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Avalado por Graphisoft Argentina</span>
              </div>
            </div>

            <div className="pt-2">
              <BlockedRestricted 
                isBlocked={!isEnrolled && course.is_active === false}
                title="Curso no disponible"
                message="Este curso no está disponible para inscripción en este momento."
              >
                <Button 
                  size="lg" 
                  className="w-full text-base font-semibold"
                  onClick={onCTAClick}
                  data-testid={isEnrolled ? "button-continue" : "button-enroll"}
                >
                  {ctaButtonText}
                </Button>
              </BlockedRestricted>
            </div>
          </CardContent>
        </Card>
        </ComingSoonCard>
      </div>
    </div>
  );
}
