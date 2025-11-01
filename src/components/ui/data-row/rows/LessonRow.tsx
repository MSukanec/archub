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
      {/* Layout vertical completo */}
      <div className="w-full space-y-3">
        {/* 1. Nombre de Lección */}
        <p className="font-medium text-sm leading-tight">
          {lesson.title}
        </p>

        {/* 2. Nombre de Módulo */}
        <p className="text-xs text-muted-foreground">
          {lesson.module_title}
        </p>

        {/* 3. Datos / Badge */}
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
          {/* Badge de estado */}
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

        {/* 4. Botones: 2/3 Ir a Lección + 1/3 Favorito */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          {/* Botón Ir a Lección (2/3) */}
          <Button
            variant="default"
            size="sm"
            className="col-span-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGoToLesson(lesson.id);
            }}
            data-testid={`button-go-to-lesson-${lesson.id}`}
          >
            Ir a Lección
          </Button>

          {/* Botón Favorito (1/3) */}
          <div className="flex items-center justify-center">
            <FavoriteButton 
              lessonId={lesson.id}
              courseId={courseId}
              isFavorite={lesson.is_favorite}
              variant="icon"
              size="md"
            />
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}
