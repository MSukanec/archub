import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, Eye, ShoppingCart } from 'lucide-react';
import type { Course } from '@shared/schema';

interface UnifiedCourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    short_description?: string | null;
    cover_url?: string | null;
    price?: number | null;
    instructor_name?: string | null;
    instructor_title?: string | null;
    badge_text?: string | null;
  };
  isEnrolled?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  onViewCourse?: () => void;
  onBuyCourse?: () => void;
  showCartIcon?: boolean;
  ctaDisabled?: boolean;
}

export function UnifiedCourseCard({
  course,
  isEnrolled = false,
  progress,
  onViewCourse,
  onBuyCourse,
  showCartIcon = false,
  ctaDisabled = false,
}: UnifiedCourseCardProps) {
  const hasProgress = progress && progress.total > 0;
  
  // If user is not enrolled, use public card style
  if (!isEnrolled) {
    return (
      <Link href={`/cursos/${course.slug}`}>
        <Card 
          className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
          data-testid={`card-course-${course.id}`}
        >
          {/* Cover Image */}
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
            {/* Badge Overlay */}
            {course.badge_text && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="px-3 py-1 shadow-md">
                  <Award className="w-3 h-3 mr-1.5 inline" />
                  {course.badge_text}
                </Badge>
              </div>
            )}
          </div>

          {/* Course Info */}
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

          <CardFooter className="pt-3 border-t flex justify-between items-center">
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
          </CardFooter>
        </Card>
      </Link>
    );
  }

  // If user is enrolled, use dashboard card style
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
      data-testid={`card-course-${course.id}`}>
      
      {/* Cover Image */}
      <div 
        className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={onViewCourse}
      >
        {course.cover_url ? (
          <img 
            src={course.cover_url} 
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <BookOpen className="h-16 w-16 text-primary/20" />
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 
          className="font-semibold text-base mb-3 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={onViewCourse}
          data-testid={`course-title-${course.id}`}
        >
          {course.title}
        </h3>

        {/* Progress Section */}
        {hasProgress && (
          <div className="space-y-2 mb-4 mt-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {!hasProgress && (
          <div className="mb-4 mt-auto text-xs text-muted-foreground">
            Inscrito
          </div>
        )}

        {/* Action Button */}
        <div className="w-full">
          <Button 
            onClick={onViewCourse}
            className="w-full gap-2"
            size="sm"
            data-testid={`button-view-course-${course.id}`}
            disabled={ctaDisabled}
          >
            <Eye className="w-4 h-4" />
            {progress?.completed ? 'Continuar Curso' : 'Ver Curso'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
