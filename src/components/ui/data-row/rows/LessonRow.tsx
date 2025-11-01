import { CheckCircle2, Circle, Clock, FileText, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataRowCard from '../DataRowCard';

interface LessonRowProps {
  lesson: {
    id: string;
    title: string;
    duration_sec: number | null;
    module_title: string;
    notes_count: number;
    markers_count: number;
    is_completed: boolean;
  };
  onGoToLesson: (lessonId: string) => void;
}

export default function LessonRow({ lesson, onGoToLesson }: LessonRowProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const totalMins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${totalMins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DataRowCard
      data-testid={`lesson-row-${lesson.id}`}
      onClick={() => onGoToLesson(lesson.id)}
    >
      {/* Avatar Section - Completion Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {lesson.is_completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Lesson Title */}
        <p className="font-medium text-sm truncate">
          {lesson.title}
        </p>

        {/* Module Info */}
        <p className="text-xs text-muted-foreground truncate">
          {lesson.module_title}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(lesson.duration_sec)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{lesson.notes_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="h-3 w-3" />
            <span>{lesson.markers_count}</span>
          </div>
        </div>
      </div>

      {/* Trailing Section - Status Badge */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {lesson.is_completed ? (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs">
            Completada
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Pendiente
          </Badge>
        )}
      </div>

      {/* Expandable Details Section - Action Button */}
      <div className="col-span-full pt-3 border-t border-border/50">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onGoToLesson(lesson.id);
          }}
          data-testid={`button-go-to-lesson-${lesson.id}`}
        >
          Ir a Lección
        </Button>
      </div>
    </DataRowCard>
  );
}
