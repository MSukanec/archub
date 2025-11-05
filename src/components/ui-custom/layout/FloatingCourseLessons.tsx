import { useState, useEffect } from "react";
import { BookOpen, X, Play, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FloatingCourseLessonsProps {
  modules: any[];
  lessons: any[];
  currentLessonId?: string;
  courseId: string;
}

export function FloatingCourseLessons({ 
  modules, 
  lessons, 
  currentLessonId,
  courseId 
}: FloatingCourseLessonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);

  // Auto-expandir el módulo que contiene la lección actual o el primer módulo
  useEffect(() => {
    if (currentLessonId && lessons.length > 0) {
      const currentLesson = lessons.find(l => l.id === currentLessonId);
      if (currentLesson) {
        setExpandedModules(prev => {
          // Solo actualizar si el módulo no está ya expandido
          if (!prev.has(currentLesson.module_id)) {
            return new Set([currentLesson.module_id]);
          }
          return prev;
        });
        return; // Salir temprano si encontramos la lección
      }
      // Si no encontramos la lección, continuar al fallback
    }
    
    // Fallback: expandir el primer módulo si no hay ninguno expandido o si el módulo expandido ya no existe
    if (modules.length > 0) {
      setExpandedModules(prev => {
        // Si no hay módulos expandidos, expandir el primero
        if (prev.size === 0) {
          return new Set([modules[0].id]);
        }
        
        // Si el módulo expandido ya no existe en la lista actual, expandir el primero
        const currentExpandedId = Array.from(prev)[0];
        const moduleStillExists = modules.some(m => m.id === currentExpandedId);
        if (!moduleStillExists) {
          return new Set([modules[0].id]);
        }
        
        return prev;
      });
    }
  }, [currentLessonId, lessons, modules]);

  // Fetch progress for all lessons in the course
  const { data: progressData } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      
      const res = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        return [];
      }
      
      return res.json();
    },
    enabled: !!courseId && !!supabase
  });

  // Create a map of lesson progress for quick lookup
  const progressMap = new Map(
    (progressData || []).map((p: any) => [p.lesson_id, p])
  );

  const toggleModule = (moduleId: string) => {
    if (expandedModules.has(moduleId)) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set([moduleId]));
    }
  };

  const handleLessonClick = (lessonId: string) => {
    goToLesson(lessonId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón flotante - LADO DERECHO, 80px arriba del FloatingAIChat (bottom-24 = 96px) */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-40",
          "relative h-14 w-14 rounded-full",
          "bg-accent text-accent-foreground",
          "flex items-center justify-center",
          "transition-all duration-500",
          "hover:scale-105",
          "animate-breathe",
          "shadow-glow"
        )}
        data-testid="button-floating-lessons"
      >
        <BookOpen className="h-6 w-6" />
        
        {/* Pulso de resplandor animado */}
        <span className="absolute inset-0 rounded-full bg-accent opacity-40 animate-ping-slow" />
      </button>

      {/* Drawer Mobile - Fullscreen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[var(--main-sidebar-bg)] overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--main-sidebar-border)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-white !text-white">
                  Contenido del Curso
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors"
                data-testid="button-close-lessons"
              >
                <X className="w-5 h-5 text-[var(--main-sidebar-fg)]" />
              </button>
            </div>

            {/* Contenido - Módulos y Lecciones */}
            <div className="overflow-y-auto h-[calc(100vh-65px)] p-4">
              <div className="space-y-2">
                {modules.map((module) => {
                  const moduleLessons = lessons.filter(l => l.module_id === module.id);
                  const isModuleExpanded = expandedModules.has(module.id);
                  const hasActiveLesson = moduleLessons.some(l => l.id === currentLessonId);

                  return (
                    <div key={module.id}>
                      {/* Módulo Header */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className={cn(
                          "w-full h-12 px-4 rounded-lg",
                          "flex items-center justify-between",
                          "transition-colors",
                          "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                          hasActiveLesson && "bg-[var(--main-sidebar-button-hover-bg)]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className={cn(
                            "w-5 h-5",
                            hasActiveLesson ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]"
                          )} />
                          <span className={cn(
                            "text-sm font-medium text-left",
                            hasActiveLesson ? "text-[var(--accent)]" : "text-white"
                          )}>
                            {module.title}
                          </span>
                        </div>
                        <svg 
                          className={cn(
                            "w-4 h-4 transition-transform",
                            hasActiveLesson ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                            isModuleExpanded && "rotate-90"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Lecciones del módulo */}
                      {isModuleExpanded && (
                        <div className="mt-1 ml-4 border-l-2 border-[var(--main-sidebar-border)] pl-2 space-y-1">
                          {moduleLessons.map((lesson) => {
                            const isActive = currentLessonId === lesson.id;
                            const progress = progressMap.get(lesson.id);
                            const isCompleted = progress?.is_completed;

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson.id)}
                                className={cn(
                                  "w-full h-11 px-3 rounded-lg",
                                  "flex items-center justify-between",
                                  "transition-colors",
                                  isActive 
                                    ? "bg-[var(--main-sidebar-button-active-bg)]" 
                                    : "hover:bg-[var(--main-sidebar-button-hover-bg)]"
                                )}
                                data-testid={`lesson-mobile-${lesson.id}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Play className={cn(
                                    "w-4 h-4 flex-shrink-0",
                                    isActive ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]"
                                  )} />
                                  <span className={cn(
                                    "text-sm truncate",
                                    isActive ? "text-white font-medium" : "text-[var(--main-sidebar-fg)]"
                                  )}>
                                    {lesson.title}
                                  </span>
                                </div>
                                {/* Progress Circle */}
                                {isCompleted ? (
                                  <CheckCircle2 
                                    className="w-4 h-4 flex-shrink-0 ml-2"
                                    style={{ color: 'var(--accent)' }}
                                  />
                                ) : (
                                  <Circle 
                                    className={cn(
                                      "w-4 h-4 flex-shrink-0 ml-2",
                                      isActive ? "text-white/50" : "text-[var(--main-sidebar-fg)]/30"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2), 
                        0 0 25px rgba(var(--accent-rgb), 0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3), 
                        0 0 35px rgba(var(--accent-rgb), 0.15);
          }
        }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .animate-breathe {
          animation: breathe 4.5s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2), 
                      0 0 25px rgba(var(--accent-rgb), 0.1);
        }

        /* Scrollbar styling - sutil y similar al fondo */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: var(--main-sidebar-bg);
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </>
  );
}
