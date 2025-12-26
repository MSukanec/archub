import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Circle, PlayCircle, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
  imageUrl?: string;
  isExpanded?: boolean;
  isActive?: boolean;
  nextRecommendedLessonId?: string | null;
  onGoToLesson: (lessonId: string) => void;
  onToggle?: () => void;
  onMarkAllComplete?: (lessonIds: string[]) => void;
  isMarkingComplete?: boolean;
}
export function ModuleSection({
  moduleId,
  moduleTitle,
  moduleIndex,
  lessons,
  imageUrl,
  isExpanded: controlledExpanded,
  isActive = false,
  nextRecommendedLessonId,
  onGoToLesson,
  onToggle,
  onMarkAllComplete,
  isMarkingComplete = false
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
  const getEffortLabel = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours < 3) return 'Módulo corto';
    if (hours <= 5) return 'Módulo medio';
    return 'Módulo largo';
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
        "hover:border-muted-foreground/20"
      )}
      data-testid={`module-section-${moduleId}`}
    >
      {/* Module Header */}
      <button
        onClick={handleToggle}
        className="group w-full flex items-center gap-4 p-4 text-left transition-colors rounded-t-xl relative overflow-hidden"
        style={imageUrl ? {
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          backgroundColor: 'hsl(var(--muted))'
        }}
        data-testid={`module-header-${moduleId}`}
      >
        {/* Module Number */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
          imageUrl ? "bg-white/20 text-white border border-white/40" : (
            isModuleComplete 
              ? "bg-positive/10 text-positive" 
              : isActive 
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )
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
        <div className={cn("flex-1 min-w-0", imageUrl && "text-white")}>
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold text-base truncate", imageUrl && "text-white")}>{moduleTitle}</h3>
            {isActive && !isModuleComplete && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", imageUrl ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                En curso
              </span>
            )}
          </div>
          <div className={cn("flex items-center gap-3 mt-1 text-sm", imageUrl ? "text-white/80" : "text-muted-foreground")}>
            <span>{totalCount} {totalCount === 1 ? 'lección': 'lecciones'}</span>
            <span>·</span>
            <span>{formatTotalDuration(totalDuration)}</span>
            <span>·</span>
            <span className={cn("italic", imageUrl ? "text-white/70" : "text-muted-foreground/80")}>
              {getEffortLabel(totalDuration)}
            </span>
            {completedCount > 0 && (
              <>
                <span>·</span>
                <span className={cn("font-medium", imageUrl ? "text-white" : "text-positive")}>
                  {completedCount}/{totalCount}
                </span>
              </>
            )}
          </div>
          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className={cn("mt-2 h-1 rounded-full overflow-hidden", imageUrl ? "bg-white/20" : "bg-muted")}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", imageUrl ? "bg-white" : "bg-positive")}
              />
            </div>
          )}
        </div>
        {/* Mark All Complete Button - appears on hover */}
        {!isModuleComplete && onMarkAllComplete && (
          <div 
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={isMarkingComplete}
              onClick={(e) => {
                e.stopPropagation();
                const incompleteLessonIds = lessons
                  .filter(l => !l.is_completed)
                  .map(l => l.id);
                if (incompleteLessonIds.length > 0) {
                  onMarkAllComplete(incompleteLessonIds);
                }
              }}
              className={cn(
                "h-8 px-3 text-xs font-medium",
                imageUrl 
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/30" 
                  : "bg-positive/10 hover:bg-positive/20 text-positive"
              )}
              data-testid={`button-mark-all-complete-${moduleId}`}
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Completar todo
            </Button>
          </div>
        )}
        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={cn("h-5 w-5", imageUrl ? "text-white" : "text-muted-foreground")} />
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
