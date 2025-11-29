import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, Eye } from 'lucide-react';

type CourseMode = 'public' | 'dashboard';

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
  const hasProgress = progress && progress.percentage > 0;
  
  const courseInfoUrl = mode === 'public' 
    ? `/cursos/${course.slug}` 
    : `/learning/courses/${course.slug}/info`;
  
  const courseLearningUrl = mode === 'public'
    ? `/cursos/${course.slug}`
    : `/learning/courses/${course.slug}`;
  
  const cardContent = (
    <Card 
      className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
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
            <Badge variant="secondary" className="px-3 py-1 shadow-md">
              <Award className="w-3 h-3 mr-1.5 inline" />
              {course.badge_text}
            </Badge>
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
            {course.price ? (
              <div className="flex flex-col">
                <span className="text-2xl font-bold">${course.price}</span>
                <span className="text-xs text-muted-foreground">USD / año</span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-primary">Gratis</span>
            )}
            <span className="text-sm text-primary font-medium group-hover:underline">
              Ver más →
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );

  const cardUrl = mode === 'public' ? `/cursos/${course.slug}` : `/learning/courses/${course.slug}`;

  if (!isEnrolled) {
    return <Link href={cardUrl}>{cardContent}</Link>;
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
