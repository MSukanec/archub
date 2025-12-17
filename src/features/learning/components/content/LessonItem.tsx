import { Play, CheckCircle2, Circle, Clock, FileText, Bookmark, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/features/learning';
import { motion } from 'framer-motion';

interface LessonItemProps {
  lesson: {
    id: string;
    title: string;
    duration_sec: number | null;
    notes_count: number;
    markers_count: number;
    is_completed: boolean;
    is_favorite: boolean;
  };
  courseId: string;
  isActive?: boolean;
  isNextRecommended?: boolean;
  onGoToLesson: (lessonId: string) => void;
}

export function LessonItem({ 
  lesson, 
  courseId, 
  isActive = false,
  isNextRecommended = false,
  onGoToLesson 
}: LessonItemProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const totalMins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${totalMins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = formatDuration(lesson.duration_sec);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200",
        "hover:bg-muted/50 cursor-pointer",
        isActive && "bg-primary/5 border border-primary/20",
        isNextRecommended && !isActive && "bg-accent/50 border border-accent"
      )}
      onClick={() => onGoToLesson(lesson.id)}
      data-testid={`lesson-item-${lesson.id}`}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {lesson.is_completed ? (
          <div className="w-8 h-8 rounded-full bg-chart-positive/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-chart-positive" />
          </div>
        ) : isNextRecommended ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Play className="h-4 w-4 text-primary-foreground fill-current" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 transition-colors">
            <Circle className="h-3 w-3 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            lesson.is_completed && "text-muted-foreground"
          )}>
            {lesson.title}
          </span>
          {isNextRecommended && !lesson.is_completed && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              Continuar
            </span>
          )}
        </div>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>
          )}
          {lesson.notes_count > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{lesson.notes_count}</span>
            </div>
          )}
          {lesson.markers_count > 0 && (
            <div className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" />
              <span>{lesson.markers_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <FavoriteButton
          lessonId={lesson.id}
          courseId={courseId}
          isFavorite={lesson.is_favorite}
          variant="icon"
          size="sm"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onGoToLesson(lesson.id);
          }}
          data-testid={`button-go-to-lesson-${lesson.id}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
