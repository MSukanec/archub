import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen, Clock, CheckCircle, MessageCircle, Shield, ChevronUp } from 'lucide-react';
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
  // IMPORTANT: 100vw includes scrollbar width (~17px), but container margin is calculated
  // without it. We need to account for this difference.
  // 
  // Container max-width at xl: 1280px, at 2xl: 1536px
  // Container has px-4 sm:px-6 lg:px-8 padding (32px at lg+)
  // Grid layout: [1fr_400px] reserves 400px column for the card
  // Card is 368px wide, centered in 400px column = 16px margin each side
  // 
  // The card's right edge should align with the container's right padding edge.
  // right = (viewport - container) / 2 + padding + card_margin + scrollbar_compensation
  //       = (100vw - 1280px) / 2 + 32px + 16px + ~8px (half scrollbar)
  
  return (
    <>
      <style>{`
        .course-sticky-card-fixed {
          position: fixed;
          top: 6rem;
          z-index: 40;
          width: 368px;
          right: max(48px, calc((100vw - 1280px) / 2 + 48px));
        }
        
        @media (min-width: 1536px) {
          .course-sticky-card-fixed {
            right: max(48px, calc((100vw - 1536px) / 2 + 48px));
          }
        }
        
        .course-sticky-card-fixed.dashboard-mode {
          right: max(48px, calc((100vw - 72px - 1280px) / 2 + 48px));
        }
        
        @media (min-width: 1536px) {
          .course-sticky-card-fixed.dashboard-mode {
            right: max(48px, calc((100vw - 72px - 1536px) / 2 + 48px));
          }
        }
      `}</style>
      <div 
        className={`hidden xl:block course-sticky-card-fixed ${mode === 'dashboard' ? 'dashboard-mode' : ''}`}
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
      
      {/* Mobile/Tablet Bottom Bar - Visible only below xl breakpoint */}
      <MobileBottomBar
        course={course}
        stats={stats}
        isEnrolled={isEnrolled}
        progressPercentage={progressPercentage}
        onCTAClick={onCTAClick}
        ctaButtonText={ctaButtonText}
      />
    </>
  );
}

interface MobileBottomBarProps {
  course: any;
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  onCTAClick: () => void;
  ctaButtonText: string;
}

function MobileBottomBar({
  course,
  stats,
  isEnrolled,
  progressPercentage,
  onCTAClick,
  ctaButtonText,
}: MobileBottomBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      {/* Main bar with price and CTA */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Price or Progress */}
          <div className="flex-1 min-w-0">
            {isEnrolled ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tu progreso</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                {course.price && (
                  <>
                    <span className="text-2xl font-bold text-primary">${course.price}</span>
                    <span className="text-xs text-muted-foreground">/ año</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Right: Buttons */}
          <div className="flex items-center gap-2">
            {/* Details Sheet Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Detalles</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto">
                <div className="space-y-6 py-4">
                  {/* Course Image */}
                  {course.cover_url && (
                    <div className="aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg">
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="font-bold text-xl">{course.title}</h3>
                  </div>
                  
                  {/* Price */}
                  {course.price && !isEnrolled && (
                    <div className="text-center">
                      <span className="text-4xl font-bold text-primary">${course.price}</span>
                      <span className="text-sm text-muted-foreground ml-2">/ año</span>
                    </div>
                  )}
                  
                  {/* Progress */}
                  {isEnrolled && (
                    <div className="space-y-2 max-w-xs mx-auto">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>{stats.total_modules} Módulos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>{stats.total_lessons} Lecciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span>{stats.total_duration_formatted}</span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-2 text-sm border-t pt-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Certificado de Curso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Foro de Consultas Privado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Avalado por Graphisoft Argentina</span>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="pt-4">
                    <Button 
                      size="lg" 
                      className="w-full text-base font-semibold"
                      onClick={() => {
                        setIsOpen(false);
                        onCTAClick();
                      }}
                    >
                      {ctaButtonText}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Main CTA */}
            <BlockedRestricted 
              isBlocked={!isEnrolled && course.is_active === false}
              title="Curso no disponible"
              message="Este curso no está disponible para inscripción en este momento."
            >
              <Button 
                size="sm"
                className="font-semibold whitespace-nowrap"
                onClick={onCTAClick}
              >
                {ctaButtonText}
              </Button>
            </BlockedRestricted>
          </div>
        </div>
      </div>
    </div>
  );
}
