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
  // Container uses max-width from Tailwind's container class
  // At xl (1280px+): max-width is 1280px with px-8 (32px) padding = 1216px content
  // At 2xl (1536px+): max-width is 1536px with px-8 (32px) padding = 1472px content
  // 
  // The card should align with the right edge of the container's content area
  // Grid layout: [1fr_400px] means we reserve 400px for the card column
  // Card is 368px wide, centered in 400px = 16px offset from grid column edge
  // 
  // Right offset = (viewport - container_max_width) / 2 + container_padding + card_margin
  // For xl: right = (100vw - 1280px) / 2 + 32px (padding) + 16px (center in column)
  // Simplified: right = (100vw - 1280px) / 2 + 16px (align card to right edge of 400px column)
  const containerMaxWidth = '1280px';
  const containerPadding = '32px'; // px-4 sm:px-6 lg:px-8 = 32px at lg+
  const cardMarginFromEdge = '16px'; // (400px - 368px) / 2 = center card in column
  
  // For dashboard mode, subtract sidebar width (72px for collapsed sidebar)
  const sidebarOffset = mode === 'dashboard' ? ' - 72px' : '';
  
  const fixedRightOffset = `max(${containerPadding}, calc((100vw - ${containerMaxWidth}${sidebarOffset}) / 2 + ${cardMarginFromEdge}))`;
  
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
