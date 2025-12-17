import { useState, useEffect } from 'react';
import { BookOpen, Bookmark, Play, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('lecciones');

  useEffect(() => {
    if (activeLessonId && lessons.length > 0) {
      const currentLesson = lessons.find(l => l.id === activeLessonId);
      if (currentLesson) {
        setExpandedModules(new Set([currentLesson.module_id]));
      }
    }
  }, [activeLessonId, lessons]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-[300px] h-full flex flex-col bg-sidebar border-l border-sidebar-border rounded-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="pt-4 pb-2 px-4 border-b border-sidebar-border">
          <h3 className="text-sm font-semibold text-sidebar-foreground mb-3">
            Contenido del Curso
          </h3>
          
          <TabsList className="w-full grid grid-cols-2 bg-muted">
            <TabsTrigger 
              value="lecciones" 
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-lecciones"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Lecciones
            </TabsTrigger>
            <TabsTrigger 
              value="marcadores" 
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-marcadores"
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Marcadores
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lecciones" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col py-2">
              {modules.map((module) => {
                const moduleLessons = lessons
                  .filter(l => l.module_id === module.id)
                  .sort((a, b) => a.sort_index - b.sort_index);
                const isModuleExpanded = expandedModules.has(module.id);
                const hasActiveLesson = moduleLessons.some(l => l.id === activeLessonId);
                const completedCount = moduleLessons.filter(l => progressMap.get(l.id)?.is_completed).length;
                const totalCount = moduleLessons.length;
                
                return (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full h-10 px-4 rounded-md cursor-pointer transition-colors hover:bg-sidebar-accent flex items-center group"
                      data-testid={`module-${module.id}`}
                    >
                      <BookOpen className={cn(
                        "w-[18px] h-[18px] flex-shrink-0",
                        hasActiveLesson 
                          ? "text-primary" 
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                      )} />
                      <span className={cn(
                        "ml-3 text-sm font-medium truncate flex-1 text-left",
                        hasActiveLesson
                          ? "text-primary"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                      )}>
                        {module.title}
                      </span>
                      <span className="text-xs text-sidebar-foreground/50 mr-2">
                        {completedCount}/{totalCount}
                      </span>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform flex-shrink-0",
                        hasActiveLesson
                          ? "text-primary"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
                        isModuleExpanded && "rotate-90"
                      )} />
                    </button>

                    {isModuleExpanded && (
                      <div className="ml-4 border-l border-sidebar-border pl-2 my-1">
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
                                "w-full rounded-md cursor-pointer transition-colors flex items-center group px-3 py-2 my-[2px]",
                                isActive 
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                              )}
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <Play 
                                className={cn(
                                  "w-[14px] h-[14px] flex-shrink-0",
                                  isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                                )}
                              />
                              <div className="ml-2 flex-1 min-w-0 text-left">
                                <span 
                                  className={cn(
                                    "text-xs truncate block",
                                    isActive ? "text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                                  )}
                                >
                                  {lesson.title}
                                </span>
                                {duration && (
                                  <span className="text-[10px] text-sidebar-foreground/50">
                                    {duration}
                                  </span>
                                )}
                              </div>
                              {isCompleted ? (
                                <CheckCircle2 
                                  className="w-[14px] h-[14px] flex-shrink-0 ml-2 text-primary"
                                />
                              ) : (
                                <Circle 
                                  className={cn(
                                    "w-[14px] h-[14px] flex-shrink-0 ml-2",
                                    isActive ? "text-sidebar-accent-foreground/50" : "text-sidebar-foreground/30"
                                  )}
                                />
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
        </TabsContent>

        <TabsContent value="marcadores" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {markersContent || (
                <div className="text-center py-8 text-sidebar-foreground/50">
                  <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay marcadores en esta lección</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
