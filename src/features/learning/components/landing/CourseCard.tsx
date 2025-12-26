import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Award } from 'lucide-react';
import { ComingSoonCard } from '@/components/shared/restrictions';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import type { Course, ItemStatus } from '@shared/schema';
interface CourseCardProps {
  course: Course;
}
function CourseCardContent({ course }: { course: Course }) {
  return (
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
  );
}
export function CourseCard({ course }: CourseCardProps) {
  const status = (course.status || 'available') as ItemStatus;
  const isAdmin = useIsAdmin();
  const isBlocking = status !== 'available'&& !isAdmin;
  if (isBlocking) {
    return (
      <ComingSoonCard status={status}>
        <CourseCardContent course={course} />
      </ComingSoonCard>
    );
  }
  return (
    <ComingSoonCard status={status}>
      <Link href={`/cursos/${course.slug}`}>
        <CourseCardContent course={course} />
      </Link>
    </ComingSoonCard>
  );
}
