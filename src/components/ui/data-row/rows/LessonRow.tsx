import { CheckCircle2, Circle, Clock, FileText, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataRowCard from '../DataRowCard';
import { FavoriteButton } from '@/components/learning/FavoriteButton';

interface LessonRowProps {
  lesson: {
    id: string;
    title: string;
    duration_sec: number | null;
    module_title: string;
    notes_count: number;
    markers_count: number;
    is_completed: boolean;
    is_favorite: boolean; // 🌟 NUEVO
  };
  courseId: string; // 🌟 NUEVO: Necesario para FavoriteButton
  onGoToLesson: (lessonId: string) => void;
}

export default function LessonRow({ lesson, courseId, onGoToLesson }: LessonRowProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const totalMins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${totalMins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DataRowCard
      data-testid={`lesson-row-${lesson.id}`}
    >
      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Lesson Title */}
        <p className="font-medium text-sm">
          {lesson.title}
        </p>

        {/* Module Info */}
        <p className="text-xs text-muted-foreground">
          {lesson.module_title}
        </p>

        {/* Stats Row with Badge inline */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
          {/* Badge inline con stats */}
          {lesson.is_completed ? (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completada
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              <Circle className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons - Full Width Below */}
      <div className="col-span-full pt-3 border-t border-border/50 flex items-center gap-2">
        {/* 🌟 BOTÓN DE FAVORITO */}
        <FavoriteButton 
          lessonId={lesson.id}
          courseId={courseId}
          isFavorite={lesson.is_favorite}
          variant="icon"
          size="md"
        />
        
        {/* BOTÓN IR A LECCIÓN */}
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault();
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
