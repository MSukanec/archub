import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LessonItem } from './LessonItem';

interface Lesson {
  id: string;
  title: string;
  duration_sec: number | null;
  notes_count: number;
  markers_count: number;
  is_completed: boolean;
  is_favorite: boolean;
}

interface ModuleSectionProps {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  lessons: Lesson[];
  courseId: string;
  isExpanded?: boolean;
  isActive?: boolean;
  nextRecommendedLessonId?: string | null;
  onGoToLesson: (lessonId: string) => void;
  onToggle?: () => void;
}

export function ModuleSection({
  moduleId,
  moduleTitle,
  moduleIndex,
  lessons,
  courseId,
  isExpanded: controlledExpanded,
  isActive = false,
  nextRecommendedLessonId,
  onGoToLesson,
  onToggle
}: ModuleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(isActive);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (isActive && controlledExpanded === undefined) {
      setInternalExpanded(true);
    }
  }, [isActive, controlledExpanded]);

  const completedCount = lessons.filter(l => l.is_completed).length;
  const totalCount = lessons.length;
  const isModuleComplete = completedCount === totalCount && totalCount > 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_sec || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div 
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        isActive && "ring-2 ring-accent/20 border-accent/30",
        !isActive && "hover:border-muted-foreground/20"
      )}
      data-testid={`module-section-${moduleId}`}
    >
      {/* Module Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors rounded-t-xl"
        data-testid={`module-header-${moduleId}`}
      >
        {/* Module Number */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
          isModuleComplete 
            ? "bg-chart-positive/10 text-chart-positive" 
            : isActive 
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}>
          {isModuleComplete ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isActive ? (
            <PlayCircle className="h-5 w-5" />
          ) : (
            <span>{moduleIndex + 1}</span>
          )}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{moduleTitle}</h3>
            {isActive && !isModuleComplete && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                En curso
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{totalCount} {totalCount === 1 ? 'lección' : 'lecciones'}</span>
            <span>·</span>
            <span>{formatTotalDuration(totalDuration)}</span>
            {completedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-chart-positive font-medium">
                  {completedCount}/{totalCount} completadas
                </span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-chart-positive rounded-full"
              />
            </div>
          )}
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Lessons List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              <div className="border-t pt-3 space-y-1">
                {lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    courseId={courseId}
                    isNextRecommended={lesson.id === nextRecommendedLessonId}
                    onGoToLesson={onGoToLesson}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
