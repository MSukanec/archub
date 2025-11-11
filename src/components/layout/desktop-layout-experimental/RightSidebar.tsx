/**
 * 🔧 RightSidebar - Sidebar derecho con controles del usuario
 * 
 * Sidebar expandible estilo Firebase:
 * - Hover sobre notificaciones expande el panel hacia la izquierda
 * - Panel de notificaciones integrado en el sidebar
 * 
 * MODO LEARNER (Capacitaciones):
 * - Sin botón de IA
 * - Muestra módulos/lecciones cuando estás en un curso
 */

import { useRef, useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { AIPanel } from "@/components/ai/AIPanel";
import { SidebarIconButton } from "../desktop/SidebarIconButton";
import { 
  Sparkles, 
  PanelLeftClose,
  BookOpen,
  Play,
  Circle,
  CheckCircle2,
  PanelRightOpen,
  PanelRightClose
} from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserMode } from "@/hooks/use-user-mode";
import { useCourseSidebarStore } from "@/stores/sidebarStore";
import { useCoursePlayerStore } from "@/stores/coursePlayerStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function RightSidebar() {
  const { isDark, toggleTheme } = useThemeStore();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const userFullName = userData?.user?.full_name || userData?.user?.first_name || 'Usuario';
  const userAvatarUrl = userData?.user?.avatar_url;
  const userMode = useUserMode();
  
  // Estado para expansión del sidebar usando Zustand store
  const { activePanel, setActivePanel, togglePanel } = useRightSidebarStore();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Course sidebar states
  const [isDocked, setIsDocked] = useState(false);
  const [isHovered, setHovered] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Get current location
  const [location] = useLocation();
  const [match, params] = useRoute('/learning/courses/:courseSlug');
  
  // Check if we're on the course PLAYER tab specifically (not just any course page)
  const isOnCoursePlayerTab = match && !!params?.courseSlug && location.includes('tab=Reproductor');
  const courseSlug = isOnCoursePlayerTab ? params?.courseSlug : null;

  // Get current lesson from stores
  const { currentLessonId: sidebarLessonId, setCurrentLesson } = useCourseSidebarStore();
  const storeLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const activeLessonId = storeLessonId || sidebarLessonId || null;

  // Fetch course by slug to get real ID
  const { data: course } = useQuery({
    queryKey: ['course', courseSlug],
    queryFn: async () => {
      if (!courseSlug || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!courseSlug && !!supabase && isOnCoursePlayerTab
  });

  // Fetch course modules using real course ID
  const { data: modules = [] } = useQuery({
    queryKey: ['course-modules', course?.id],
    queryFn: async () => {
      if (!course?.id || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_index', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!course?.id && !!supabase && isOnCoursePlayerTab
  });

  // Fetch course lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons-full', course?.id],
    queryFn: async () => {
      if (!course?.id || !supabase || modules.length === 0) return [];
      
      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, module_id, title, vimeo_video_id, duration_sec, free_preview, sort_index, is_active')
        .in('module_id', moduleIds)
        .order('sort_index', { ascending: true});
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!course?.id && !!supabase && modules.length > 0 && isOnCoursePlayerTab
  });

  // Fetch progress for all lessons
  const { data: progressData } = useQuery<any[]>({
    queryKey: ['/api/courses', course?.id, 'progress'],
    queryFn: async () => {
      if (!course?.id) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      
      const res = await fetch(`/api/courses/${course.id}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!course?.id && isOnCoursePlayerTab
  });

  // Create progress map
  const progressMap = new Map(
    (progressData || []).map((p: any) => [p.lesson_id, p])
  );

  // Auto-expand module containing current lesson
  useEffect(() => {
    if (activeLessonId && lessons.length > 0) {
      const currentLesson = lessons.find(l => l.id === activeLessonId);
      if (currentLesson) {
        setExpandedModules(new Set([currentLesson.module_id]));
      }
    }
  }, [activeLessonId, lessons]);

  const toggleModule = (moduleId: string) => {
    if (expandedModules.has(moduleId)) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set([moduleId]));
    }
  };

  const handleToggleTheme = async () => {
    const userId = userData?.user?.id;
    const preferencesId = userData?.preferences?.id;
    await toggleTheme(userId, preferencesId);
  };

  const handlePanelClick = (panel: 'ai') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    togglePanel(panel);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActivePanel(null);
      setHovered(false);
    }, 100);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Determine if we should show course content (only in Player tab)
  const showCourseContent = userMode === 'learner' && isOnCoursePlayerTab && modules.length > 0;
  const isExpanded = showCourseContent ? (isDocked || isHovered) : (activePanel !== null);

  return (
    <div className="flex flex-row h-full">
      {/* WRAPPER CON FRAME EFFECT */}
      <div className="h-full p-1 rounded-lg bg-[var(--content-bg)]">
        <div 
          className="flex flex-row h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* PANEL EXPANDIBLE - Panel de IA o Contenido del Curso */}
          {isExpanded && (
            <div className="w-[280px] h-full flex flex-col">
              {showCourseContent ? (
                /* CONTENIDO DEL CURSO */
                <div className="h-full flex flex-col">
                  {/* Título del panel */}
                  <div className="pt-4 pb-3 px-4 border-b border-[var(--main-sidebar-border)]">
                    <h3 className="text-sm font-semibold text-white">
                      Contenido del Curso
                    </h3>
                  </div>

                  {/* Módulos y Lecciones con scroll */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col py-2">
                      {modules.map((module) => {
                        const moduleLessons = lessons.filter(l => l.module_id === module.id);
                        const isModuleExpanded = expandedModules.has(module.id);
                        const hasActiveLesson = moduleLessons.some(l => l.id === activeLessonId);
                        
                        return (
                          <div key={module.id}>
                            {/* Módulo */}
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="w-full h-10 px-4 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] flex items-center group"
                            >
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
                            </button>

                            {/* Lecciones del módulo */}
                            {isModuleExpanded && (
                              <div className="ml-4 border-l border-[var(--main-sidebar-border)] pl-2 my-1">
                                {moduleLessons.map((lesson) => {
                                  const isActive = activeLessonId === lesson.id;
                                  const progress = progressMap.get(lesson.id);
                                  const isCompleted = progress && progress.is_completed;
                                  
                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() => {
                                        setCurrentLesson(lesson.id);
                                        goToLesson(lesson.id);
                                      }}
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

                  {/* Control de Anclar */}
                  <div className="pt-3 pb-3 px-4 border-t border-[var(--main-sidebar-border)]">
                    <button
                      onClick={() => setIsDocked(!isDocked)}
                      className="w-full h-10 px-3 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group"
                    >
                      {isDocked ? (
                        <PanelRightClose className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)] group-hover:text-white" />
                      ) : (
                        <PanelRightOpen className="w-[18px] h-[18px] text-[var(--main-sidebar-fg)] group-hover:text-white" />
                      )}
                      <span className="ml-3 text-sm text-[var(--main-sidebar-fg)] group-hover:text-white">
                        {isDocked ? "Desanclar" : "Anclar"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PANEL DE IA */
                userId && (
                  <div className="w-full h-full px-[9px] pt-6 pb-6 flex flex-col">
                    <div className="mb-6 flex items-center justify-between px-2">
                      <h2 className="text-lg font-semibold text-[var(--main-sidebar-fg)]">
                        Asistente IA
                      </h2>
                      <button
                        onClick={() => setActivePanel(null)}
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors"
                        title="Cerrar panel"
                        data-testid="button-close-panel"
                      >
                        <PanelLeftClose className="w-4 h-4 text-[var(--main-sidebar-fg)]" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <AIPanel
                        userId={userId}
                        userFullName={userFullName}
                        userAvatarUrl={userAvatarUrl}
                        onClose={() => setActivePanel(null)}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* SIDEBAR DERECHO - BOTONES (siempre visible, 50px, altura total) */}
          <div className="bg-[var(--main-sidebar-bg)] w-[50px] h-full rounded-lg flex flex-col">
            {/* SECCIÓN SUPERIOR: Botones principales */}
            <div className="px-0 pt-3 overflow-y-auto flex-1">
              <div className="flex flex-col gap-[2px] items-center">
                {showCourseContent ? (
                  /* MODO LEARNER EN CURSO: Icono de libro en lugar de IA */
                  <SidebarIconButton
                    icon={<BookOpen className="h-5 w-5" />}
                    isActive={isExpanded}
                    onClick={() => setHovered(!isHovered)}
                    title="Contenido del Curso"
                    testId="button-course-content"
                  />
                ) : userMode !== 'learner' ? (
                  /* OTROS MODOS: Botón de IA normal */
                  <SidebarIconButton
                    icon={<Sparkles className="h-5 w-5 ai-icon-sparkle" />}
                    isActive={activePanel === 'ai'}
                    onClick={() => handlePanelClick('ai')}
                    title="Asistente IA"
                    testId="button-ai"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
