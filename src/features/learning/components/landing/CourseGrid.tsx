import { CourseCard } from './CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { Course } from '@shared/schema';

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
}

function CourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
      <div className="px-6 pb-6 pt-3 border-t">
        <div className="h-8 bg-muted animate-pulse rounded w-24" />
      </div>
    </Card>
  );
}

export function CourseGrid({ courses, isLoading }: CourseGridProps) {
  // Loading State - Show 3 skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty State
  if (!courses || courses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay cursos disponibles</h3>
          <p className="text-muted-foreground max-w-md">
            Actualmente no tenemos cursos publicados. Vuelve pronto para ver nuevos contenidos.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Courses Grid - 3 columns on desktop, 2 on tablet, 1 on mobile
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="course-grid"
    >
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
