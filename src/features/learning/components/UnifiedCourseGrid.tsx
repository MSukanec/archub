import { UnifiedCourseCard } from './UnifiedCourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Tabs } from '@/components/shared/Tabs';

type CourseMode = 'public' | 'dashboard';

interface CourseWithEnrollment {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  cover_url?: string | null;
  price?: number | string | null;
  instructor_name?: string | null;
  instructor_title?: string | null;
  badge_text?: string | null;
  isEnrolled?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  onViewCourse?: () => void;
  onBuyCourse?: () => void;
  showCartIcon?: boolean;
}

interface UnifiedCourseGridProps {
  courses: CourseWithEnrollment[];
  mode?: CourseMode;
  isLoading?: boolean;
  showTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  enrolledCount?: number;
  completedCount?: number;
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

export function UnifiedCourseGrid({
  courses,
  mode = 'dashboard',
  isLoading = false,
  showTabs = false,
  activeTab = 'all',
  onTabChange,
  enrolledCount = 0,
  completedCount = 0,
}: UnifiedCourseGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {showTabs && onTabChange && (
          <Tabs
            tabs={[
              { value: 'all', label: 'Todos' },
              { value: 'enrolled', label: `Inscripto${enrolledCount > 0 ? ` (${enrolledCount})` : ''}` },
              { value: 'completed', label: `Finalizados${completedCount > 0 ? ` (${completedCount})` : ''}` }
            ]}
            value={activeTab}
            onValueChange={onTabChange}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-6">
        {showTabs && onTabChange && (
          <Tabs
            tabs={[
              { value: 'all', label: 'Todos' },
              { value: 'enrolled', label: `Inscripto${enrolledCount > 0 ? ` (${enrolledCount})` : ''}` },
              { value: 'completed', label: `Finalizados${completedCount > 0 ? ` (${completedCount})` : ''}` }
            ]}
            value={activeTab}
            onValueChange={onTabChange}
          />
        )}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay cursos disponibles</h3>
            <p className="text-muted-foreground max-w-md">
              Actualmente no hay cursos en esta sección. Vuelve pronto para ver nuevos contenidos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTabs && onTabChange && (
        <Tabs
          tabs={[
            { value: 'all', label: 'Todos' },
            { value: 'enrolled', label: `Inscripto${enrolledCount > 0 ? ` (${enrolledCount})` : ''}` },
            { value: 'completed', label: `Finalizados${completedCount > 0 ? ` (${completedCount})` : ''}` }
          ]}
          value={activeTab}
          onValueChange={onTabChange}
        />
      )}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="course-grid"
      >
        {courses.map((course) => (
          <UnifiedCourseCard
            key={course.id}
            course={course}
            mode={mode}
            isEnrolled={course.isEnrolled || false}
            progress={course.progress}
            onViewCourse={course.onViewCourse}
          />
        ))}
      </div>
    </div>
  );
}
