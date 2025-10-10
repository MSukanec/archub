import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PayButton from '@/components/learning/PayButton';

type CourseCardProps = {
  course: {
    id: string;
    slug: string;
    title: string;
    short_description?: string | null;
    is_active: boolean;
  };
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  enrollment?: {
    started_at: string;
    expires_at?: string;
  } | null;
  onViewDetail: (slug: string) => void;
};

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  progress, 
  enrollment,
  onViewDetail
}) => {
  const hasProgress = progress && progress.total > 0;
  const isEnrolled = !!enrollment;

  return (
    <div className="bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-4 mb-3 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--card-fg)] font-semibold text-base truncate mb-1">
            {course.title}
          </h3>
          {course.short_description && (
            <p className="text-[var(--muted-fg)] text-sm line-clamp-2">
              {course.short_description}
            </p>
          )}
        </div>
        <Badge 
          style={{ 
            backgroundColor: course.is_active ? 'var(--accent)' : '#6b7280', 
            color: 'white' 
          }}
          className="text-xs shrink-0"
        >
          {course.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Progress Section */}
      {isEnrolled && hasProgress && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--muted-fg)]">Progreso</span>
            <span className="text-xs font-medium text-[var(--card-fg)]">
              {progress.completed}/{progress.total} lecciones
            </span>
          </div>
          <div className="space-y-1">
            <Progress value={progress.percentage} className="h-2" />
            <div className="text-right">
              <span className="text-xs font-semibold text-[var(--card-fg)]">
                {progress.percentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Info */}
      {isEnrolled && !hasProgress && (
        <div className="mb-3 text-xs text-[var(--muted-fg)]">
          Inscrito
        </div>
      )}

      {/* Action Button */}
      <div className="w-full">
        {isEnrolled ? (
          <Button 
            onClick={() => onViewDetail(course.slug)}
            className="w-full gap-2"
            size="sm"
            data-testid={`button-view-course-${course.id}`}
          >
            <Eye className="w-4 h-4" />
            Ver Curso
          </Button>
        ) : (
          <PayButton
            courseSlug={course.slug}
            currency="ARS"
            variant="default"
            size="sm"
            className="w-full"
          />
        )}
      </div>
    </div>
  );
};

export default CourseCard;
