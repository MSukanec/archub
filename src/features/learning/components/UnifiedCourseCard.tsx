import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, Eye, CheckCircle, Clock, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import type { ItemStatus } from '@shared/schema';

type CourseMode = 'public' | 'dashboard';

const statusConfig = {
  available: {
    icon: CheckCircle,
    label: "Disponible",
    badgeClass: "bg-accent text-white border-0",
    isBlocking: false,
  },
  coming_soon: {
    icon: Clock,
    label: "Próximamente",
    badgeClass: "bg-violet-600 text-white border-0",
    isBlocking: true,
  },
  maintenance: {
    icon: Wrench,
    label: "En mantenimiento",
    badgeClass: "bg-amber-500 text-white border-0",
    isBlocking: true,
  },
} as const;

interface UnifiedCourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    short_description?: string | null;
    cover_url?: string | null;
    price?: number | string | null;
    instructor_name?: string | null;
    instructor_title?: string | null;
    badge_text?: string | null;
    status?: string | null;
  };
  mode?: CourseMode;
  isEnrolled?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  onViewCourse?: () => void;
}

export function UnifiedCourseCard({
  course,
  mode = 'dashboard',
  isEnrolled = false,
  progress,
  onViewCourse,
}: UnifiedCourseCardProps) {
  const [, navigate] = useLocation();
  const isAdmin = useIsAdmin();
  const hasProgress = progress && progress.percentage > 0;
  
  const status = (course.status || 'available') as ItemStatus;
  const config = statusConfig[status];
  const StatusIcon = config?.icon;
  const isBlocking = config?.isBlocking && !isAdmin;
  
  const courseInfoUrl = mode === 'public' 
    ? `/cursos/${course.slug}` 
    : `/learning/courses/${course.slug}/info`;
  
  const courseLearningUrl = mode === 'public'
    ? `/cursos/${course.slug}`
    : `/learning/courses/${course.slug}`;
  
  const cardContent = (
    <Card 
      className={cn(
        "h-full hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden",
        isBlocking && "opacity-50 grayscale-[30%]"
      )}
      data-testid={`card-course-${course.id}`}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/30" />
          </div>
        )}
        {course.badge_text && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold shadow-md bg-accent text-white">
              <Award className="w-3 h-3" />
              {course.badge_text}
            </span>
          </div>
        )}
        {config && StatusIcon && status !== 'available' && (
          <div className="absolute top-3 right-3">
            <span 
              className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold shadow-lg", config.badgeClass)}
              data-testid={`badge-status-${course.id}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
      </CardHeader>

      <CardContent className="pb-3">
        {course.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.short_description}
          </p>
        )}
        {course.instructor_name && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="font-medium">Instructor:</span>
            {course.instructor_name}
            {course.instructor_title && ` - ${course.instructor_title}`}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex-col gap-3">
        {isEnrolled ? (
          <>
            {hasProgress && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold">{progress?.percentage}%</span>
                </div>
                <Progress value={progress?.percentage || 0} className="h-2" />
              </div>
            )}
            
            <Button 
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(courseInfoUrl);
              }}
              className="w-full rounded-lg"
              size="sm"
              data-testid={`button-course-info-${course.id}`}
            >
              Ver Información
            </Button>
            
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onViewCourse) {
                  onViewCourse();
                } else {
                  navigate(courseLearningUrl);
                }
              }}
              className="w-full gap-2"
              size="sm"
              data-testid={`button-view-course-${course.id}`}
            >
              <Eye className="w-4 h-4" />
              {hasProgress ? 'Continuar Curso' : 'Ver Curso'}
            </Button>
          </>
        ) : (
          <div className="w-full flex justify-between items-center">
            {isBlocking ? (
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-muted-foreground">$—</span>
                <span className="text-xs text-muted-foreground">No disponible</span>
              </div>
            ) : course.price ? (
              <div className="flex flex-col">
                <span className="text-2xl font-bold">${course.price}</span>
                <span className="text-xs text-muted-foreground">USD / año</span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-primary">Gratis</span>
            )}
            <span className="text-sm text-primary font-medium group-hover:underline">
              {isBlocking ? '' : 'Ver más →'}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );

  // Si el curso está bloqueado, no permitir navegación
  if (isBlocking) {
    return <div className="select-none pointer-events-none">{cardContent}</div>;
  }

  // Si NO está inscrito → llevar a la landing page del curso (para ver info y comprar)
  // Si SÍ está inscrito → llevar al CourseView (para ver el contenido)
  const notEnrolledUrl = mode === 'public' 
    ? `/cursos/${course.slug}` 
    : `/learning/courses/${course.slug}/info`;

  if (!isEnrolled) {
    return <Link href={notEnrolledUrl}>{cardContent}</Link>;
  }

  return (
    <div onClick={() => {
      if (onViewCourse) {
        onViewCourse();
      } else {
        navigate(courseLearningUrl);
      }
    }}>
      {cardContent}
    </div>
  );
}
