import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, CheckCircle, MessageCircle, Shield } from 'lucide-react';
import type { CoursesMode } from '../types';

interface CourseStickyCardWithModeProps {
  mode: CoursesMode;
  course: any;
  stats: any;
  isEnrolled: boolean;
  progressPercentage: number;
  onCTAClick: () => void;
  ctaButtonText: string;
}

export function CourseStickyCardWithMode({ 
  mode,
  course, 
  stats, 
  isEnrolled, 
  progressPercentage,
  onCTAClick,
  ctaButtonText,
}: CourseStickyCardWithModeProps) {
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
              {course.instructor_name && (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Avalado por {course.instructor_name}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                size="lg" 
                className="w-full text-base font-semibold"
                onClick={onCTAClick}
                data-testid={isEnrolled ? "button-continue" : "button-enroll"}
              >
                {ctaButtonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
