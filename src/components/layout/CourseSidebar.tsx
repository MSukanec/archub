import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  PanelRightOpen,
  PanelRightClose,
  BookOpen,
  Play,
  Circle,
  CheckCircle2
} from "lucide-react";
import { useCourseSidebarStore } from "@/stores/sidebarStore";
import { useQuery } from "@tanstack/react-query";

interface CourseSidebarProps {
  modules: any[];
  lessons: any[];
  currentLessonId?: string;
}

export function CourseSidebar({ modules, lessons, currentLessonId }: CourseSidebarProps) {
  const { setCurrentLesson } = useCourseSidebarStore();
  const [isDocked, setIsDocked] = useState(true);
  const [isHovered, setHovered] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  const isExpanded = isDocked || isHovered;

  // Get courseId from first module
  const courseId = modules.length > 0 ? modules[0].course_id : null;

  // Fetch progress for all lessons in the course
  const { data: progressData } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    enabled: !!courseId
  });

  // Create a map of lesson progress for quick lookup
  const progressMap = new Map(
    (progressData || []).map((p: any) => [p.lesson_id, p])
  );

  // Auto-abrir el módulo que contiene la lección actual
  useEffect(() => {
    if (currentLessonId && lessons.length > 0) {
      const currentLesson = lessons.find(l => l.id === currentLessonId);
      if (currentLesson) {
        setExpandedModules(new Set([currentLesson.module_id]));
      }
    }
  }, [currentLessonId, lessons]);

  const handleDockToggle = () => {
    setIsDocked(!isDocked);
  };

  const toggleModule = (moduleId: string) => {
    // Solo permitir un acordeón abierto a la vez
    if (expandedModules.has(moduleId)) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set([moduleId]));
    }
  };

  return (
    <div 
      className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-l border-[var(--main-sidebar-border)] transition-all duration-150 z-10 overflow-hidden relative h-[calc(100vh-3rem)]"
      style={{
        width: isDocked 
          ? '280px' 
          : (isHovered ? '280px' : '50px')
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <aside 
        className={cn(
          "grid h-[calc(100vh-3rem)] grid-rows-[auto_1fr_auto]",
          isExpanded ? "w-[280px]" : "w-[50px]"
        )}
      >
        {/* SECCIÓN SUPERIOR: Título */}
        <div className={cn(
          "pt-4 pb-3 border-b border-[var(--main-sidebar-border)]",
          isExpanded ? "px-4" : "px-0 flex items-center justify-center"
        )}>
          {isExpanded ? (
            <h3 className="text-sm font-semibold text-white">
              Contenido del Curso
            </h3>
          ) : (
            <BookOpen className="w-5 h-5 text-[var(--main-sidebar-fg)]" />
          )}
        </div>

        {/* SECCIÓN MEDIA: Módulos y Lecciones con scroll */}
        <div className="overflow-y-auto">
          <div className={cn(
            "flex flex-col",
            isExpanded ? "py-2" : "items-center py-2"
          )}>
            {modules.map((module) => {
              const moduleLessons = lessons.filter(l => l.module_id === module.id);
              const isModuleExpanded = expandedModules.has(module.id);
              const hasActiveLesson = moduleLessons.some(l => l.id === currentLessonId);
              
              return (
                <div key={module.id}>
                  {/* Módulo */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className={cn(
                      "w-full h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] flex items-center group",
                      isExpanded ? "px-4" : "justify-center"
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <BookOpen className={cn(
                          "w-[18px] h-[18px] flex-shrink-0",
                          hasActiveLesson 
                            ? "text-[var(--accent)]" 
                            : "text-[var(--main-sidebar-fg)] group-hover:text-white"
                        )} />
                        <span className={cn(
                          "ml-3 text-sm font-medium truncate flex-1 text-left",
                          hasActiveLesson
                            ? "text-[var(--accent)]"
                            : "text-[var(--main-sidebar-fg)] group-hover:text-white"
                        )}>
                          {module.title}
                        </span>
                        <svg 
                          className={cn(
                            "w-4 h-4 transition-transform flex-shrink-0",
                            hasActiveLesson
                              ? "text-[var(--accent)]"
                              : "text-[var(--main-sidebar-fg)] group-hover:text-white",
                            isModuleExpanded && "rotate-90"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    ) : (
                      <BookOpen className={cn(
                        "w-[18px] h-[18px]",
                        hasActiveLesson ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]"
                      )} />
                    )}
                  </button>

                  {/* Lecciones del módulo */}
                  {isModuleExpanded && isExpanded && (
                    <div className="ml-4 border-l border-[var(--main-sidebar-border)] pl-2 my-1">
                      {moduleLessons.map((lesson) => {
                        const isActive = currentLessonId === lesson.id;
                        const progress = progressMap.get(lesson.id);
                        const isCompleted = progress && progress.completed_at;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson.id)}
                            className={cn(
                              "w-full h-9 rounded-md cursor-pointer transition-colors flex items-center group px-3 my-[2px]",
                              isActive 
                                ? "bg-[var(--main-sidebar-button-active-bg)] text-white" 
                                : "hover:bg-[var(--main-sidebar-button-hover-bg)] text-[var(--main-sidebar-fg)]"
                            )}
                            data-testid={`lesson-${lesson.id}`}
                          >
                            <Play 
                              className={cn(
                                "w-[16px] h-[16px] flex-shrink-0",
                                isActive ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)] group-hover:text-white"
                              )}
                            />
                            <span 
                              className={cn(
                                "ml-2 text-xs truncate flex-1 text-left",
                                isActive ? "text-white font-medium" : "text-[var(--main-sidebar-fg)] group-hover:text-white"
                              )}
                            >
                              {lesson.title}
                            </span>
                            {/* Progress Circle */}
                            {isCompleted ? (
                              <CheckCircle2 
                                className="w-[16px] h-[16px] flex-shrink-0 ml-2"
                                style={{ color: 'var(--accent)' }}
                                data-testid={`progress-complete-${lesson.id}`}
                              />
                            ) : (
                              <Circle 
                                className={cn(
                                  "w-[16px] h-[16px] flex-shrink-0 ml-2",
                                  isActive ? "text-white/50" : "text-[var(--main-sidebar-fg)]/30"
                                )}
                                data-testid={`progress-incomplete-${lesson.id}`}
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
        </div>

        {/* SECCIÓN INFERIOR: Control de Anclar */}
        <div className={cn(
          "pt-3 pb-3 border-t border-[var(--main-sidebar-border)]",
          isExpanded ? "px-4" : "flex items-center justify-center"
        )}>
          <button
            onClick={handleDockToggle}
            className={cn(
              "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group",
              isExpanded ? "w-full px-3" : "w-8 justify-center"
            )}
          >
            {isExpanded ? (
              <>
                {isDocked ? (
                  <PanelRightClose className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)] group-hover:text-white" />
                ) : (
                  <PanelRightOpen className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)] group-hover:text-white" />
                )}
                <span className="ml-3 text-sm text-[var(--main-sidebar-fg)] group-hover:text-white">
                  {isDocked ? "Desanclar" : "Anclar"}
                </span>
              </>
            ) : (
              isDocked ? (
                <PanelRightClose className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)]" />
              ) : (
                <PanelRightOpen className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)]" />
              )
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
