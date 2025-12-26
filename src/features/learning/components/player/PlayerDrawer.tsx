import { useState, useEffect } from 'react';
import { BookOpen, Bookmark, Play, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs } from '@/components/shared/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
interface Module {
  id: string;
  title: string;
  sort_index: number;
}
interface Lesson {
  id: string;
  title: string;
  module_id: string;
  sort_index: number;
  duration_sec?: number;
}
interface PlayerDrawerProps {
  modules: Module[];
  lessons: Lesson[];
  activeLessonId: string | null;
  progressMap: Map<string, { is_completed?: boolean; progress_pct?: number }>;
  onLessonSelect: (lessonId: string) => void;
  markersContent?: React.ReactNode;
}
export function PlayerDrawer({
  modules,
  lessons,
  activeLessonId,
  progressMap,
  onLessonSelect,
  markersContent
}: PlayerDrawerProps) {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lecciones');
  useEffect(() => {
    if (activeLessonId && lessons.length > 0) {
      const currentLesson = lessons.find(l => l.id === activeLessonId);
      if (currentLesson) {
        setExpandedModuleId(currentLesson.module_id);
      }
    }
  }, [activeLessonId, lessons]);
  const toggleModule = (moduleId: string) => {
    setExpandedModuleId(prev => prev === moduleId ? null : moduleId);
  };
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const tabs = [
    { value: 'lecciones', label: 'Lecciones', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { value: 'marcadores', label: 'Marcadores', icon: <Bookmark className="h-3.5 w-3.5" /> }
  ];
  return (
    <div className="h-full p-1 rounded-lg bg-[var(--content-bg)]">
      <div className="w-[298px] h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden min-w-0">
      <div className="pt-4 pb-2 px-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Contenido del Curso
        </h3>
        
        <Tabs 
          tabs={tabs} 
          value={activeTab} 
          onValueChange={setActiveTab}
          fullWidth
        />
      </div>
      {activeTab === 'lecciones'&& (
        <ScrollArea className="flex-1 w-full min-w-0 overflow-hidden">
          <div className="flex flex-col py-2 px-2 w-full min-w-0">
            {modules.map((module) => {
              const moduleLessons = lessons
                .filter(l => l.module_id === module.id)
                .sort((a, b) => a.sort_index - b.sort_index);
              const isModuleExpanded = expandedModuleId === module.id;
              const hasActiveLesson = moduleLessons.some(l => l.id === activeLessonId);
              const completedCount = moduleLessons.filter(l => progressMap.get(l.id)?.is_completed).length;
              const totalCount = moduleLessons.length;
              
              return (
                <div 
                  key={module.id}
                  className={cn(
                    "my-1 rounded-lg border transition-colors",
                    isModuleExpanded 
                      ? "border-border bg-muted/30" 
                      : "border-transparent hover:border-border/50"
                  )}
                >
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full h-10 px-3 cursor-pointer transition-colors flex items-center group"
                    data-testid={`module-${module.id}`}
                  >
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform flex-shrink-0",
                      hasActiveLesson
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                      isModuleExpanded && "rotate-90"
                    )} />
                    <span className={cn(
                      "ml-2 text-sm font-medium flex-1 text-left break-words line-clamp-2",
                      hasActiveLesson
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {module.title}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {completedCount}/{totalCount}
                    </span>
                  </button>
                  {isModuleExpanded && (
                    <div className="px-3 pb-2">
                      {moduleLessons.map((lesson) => {
                        const isActive = activeLessonId === lesson.id;
                        const progress = progressMap.get(lesson.id);
                        const isCompleted = progress?.is_completed;
                        const duration = formatDuration(lesson.duration_sec);
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onLessonSelect(lesson.id)}
                            className={cn(
                              "w-full rounded-md cursor-pointer transition-colors flex items-center group pl-5 pr-2 py-1.5 my-px",
                              isActive 
                                ? "" 
                                : "hover:bg-accent/50"
                            )}
                            data-testid={`lesson-${lesson.id}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 
                                className="w-3.5 h-3.5 flex-shrink-0 text-primary"
                              />
                            ) : isActive ? (
                              <Play 
                                className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent)]"
                              />
                            ) : (
                              <Circle 
                                className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/40"
                              />
                            )}
                            <span 
                              className={cn(
                                "ml-2 text-xs flex-1 text-left break-words line-clamp-2",
                                isActive ? "text-[var(--accent)] font-medium" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            >
                              {lesson.title}
                            </span>
                            {duration && (
                              <span className={cn(
                                "text-[10px] ml-2 flex-shrink-0",
                                isActive ? "text-[var(--accent)]" : "text-muted-foreground/60"
                              )}>
                                {duration}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
      {activeTab === 'marcadores'&& (
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-3">
            {markersContent || (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay marcadores en esta lección</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
      </div>
    </div>
  );
}
