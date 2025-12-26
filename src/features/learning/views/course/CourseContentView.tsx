/**
 * CourseContentTab.tsx
 * 
 * Course Structure Explorer - Premium learning experience
 * Replaces the previous table-based view with a modern, visual module explorer
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { 
  ContentHeader, 
  ModuleSection,
  useCourseStructure, 
  useCourseProgress, 
  useCoursePlayerStore
} from '@/features/learning';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CourseContentTabProps {
  courseId?: string;
  courseSlug?: string;
}

interface LessonData {
  id: string;
  title: string;
  duration_sec: number | null;
  notes_count: number;
  markers_count: number;
  is_completed: boolean;
  is_favorite: boolean;
}

interface ModuleData {
  id: string;
  title: string;
  sort_index: number;
  imageUrl?: string;
  lessons: LessonData[];
}

export default function CourseContentTab({ courseId, courseSlug }: CourseContentTabProps) {
  const [, navigate] = useLocation();
  const { setCurrentLesson } = useCourseSidebarStore();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const { data: courseStructure = [], isLoading: structureLoading } = useCourseStructure(courseId);
  const { data: courseProgress = [] } = useCourseProgress(courseId);

  const { data: notesResponse } = useQuery<{ lesson_id: string }[]>({
    queryKey: [`/api/courses/${courseId}/notes`],
    enabled: !!courseId
  });

  const { data: markersResponse } = useQuery<{ lesson_id: string }[]>({
    queryKey: [`/api/courses/${courseId}/markers`],
    enabled: !!courseId
  });

  // Get module IDs from course structure
  const moduleIds = useMemo(() => {
    return courseStructure.map((m: any) => m.id);
  }, [courseStructure]);

  // Fetch module images using module IDs (same approach as landing page)
  const { data: moduleImagesResponse } = useQuery<Record<string, string>>({
    queryKey: [`courses/${courseId}/module-images`, moduleIds],
    queryFn: async () => {
      if (!moduleIds.length) return {};
      try {
        const { data, error } = await supabase
          .from('media_links')
          .select(`
            course_module_id,
            media_files!inner (
              file_url,
              is_deleted
            )
          `)
          .in('course_module_id', moduleIds)
          .eq('category', 'module_image')
          .eq('media_files.is_deleted', false);

        if (error) throw error;

        const imageMap: Record<string, string> = {};
        (data || []).forEach((link: any) => {
          if (link.course_module_id && link.media_files) {
            const mediaFile = Array.isArray(link.media_files) 
              ? link.media_files[0] 
              : link.media_files;
            if (mediaFile?.file_url) {
              imageMap[link.course_module_id] = mediaFile.file_url;
            }
          }
        });
        return imageMap;
      } catch (error) {
        console.error('Error fetching module images:', error);
        return {};
      }
    },
    enabled: moduleIds.length > 0
  });

  const modules = useMemo<ModuleData[]>(() => {
    if (!courseStructure.length) return [];

    const notesCountMap: Record<string, { notes: number; markers: number }> = {};
    
    (notesResponse || []).forEach((note) => {
      if (!notesCountMap[note.lesson_id]) {
        notesCountMap[note.lesson_id] = { notes: 0, markers: 0 };
      }
      notesCountMap[note.lesson_id].notes++;
    });
    
    (markersResponse || []).forEach((marker) => {
      if (!notesCountMap[marker.lesson_id]) {
        notesCountMap[marker.lesson_id] = { notes: 0, markers: 0 };
      }
      notesCountMap[marker.lesson_id].markers++;
    });

    return courseStructure.map((module) => {
      const moduleLessons = (module.lessons || []).map((lesson: any) => {
        const progress = courseProgress.find((p: any) => p.lesson_id === lesson.id);
        const counts = notesCountMap[lesson.id] || { notes: 0, markers: 0 };

        return {
          id: lesson.id,
          title: lesson.title,
          duration_sec: lesson.duration_sec,
          notes_count: counts.notes,
          markers_count: counts.markers,
          is_completed: progress?.is_completed || false,
          is_favorite: progress?.is_favorite || false
        };
      });

      return {
        id: module.id,
        title: module.title,
        sort_index: module.sort_index || 0,
        imageUrl: moduleImagesResponse?.[module.id],
        lessons: moduleLessons
      };
    }).sort((a, b) => a.sort_index - b.sort_index);
  }, [courseStructure, courseProgress, notesResponse, markersResponse, moduleImagesResponse]);

  const { nextRecommendedLessonId, activeModuleId } = useMemo(() => {
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (!lesson.is_completed) {
          return { 
            nextRecommendedLessonId: lesson.id, 
            activeModuleId: module.id 
          };
        }
      }
    }
    return { nextRecommendedLessonId: null, activeModuleId: null };
  }, [modules]);

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (activeModuleId && expandedModuleId === null) {
      setExpandedModuleId(activeModuleId);
    }
  }, [activeModuleId, expandedModuleId]);

  useEffect(() => {
    if (expandedModuleId && !hasScrolledRef.current && containerRef.current) {
      const moduleElement = document.querySelector(`[data-testid="module-section-${expandedModuleId}"]`);
      if (moduleElement) {
        setTimeout(() => {
          moduleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hasScrolledRef.current = true;
        }, 300);
      }
    }
  }, [expandedModuleId]);

  const handleToggleModule = (moduleId: string) => {
    setExpandedModuleId(prev => prev === moduleId ? null : moduleId);
  };

  const stats = useMemo(() => {
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (acc, m) => acc + m.lessons.filter(l => l.is_completed).length, 
      0
    );
    const totalDurationSec = modules.reduce(
      (acc, m) => acc + m.lessons.reduce((lacc, l) => lacc + (l.duration_sec || 0), 0),
      0
    );
    return {
      totalModules: modules.length,
      totalLessons,
      completedLessons,
      totalDurationMin: Math.floor(totalDurationSec / 60)
    };
  }, [modules]);

  const handleGoToLesson = (lessonId: string) => {
    setCurrentLesson(lessonId);
    goToLesson(lessonId, null);
    
    if (courseSlug) {
      const params = new URLSearchParams();
      params.set('tab', 'Reproductor');
      params.set('lesson', lessonId);
      navigate(`/learning/courses/${courseSlug}?${params.toString()}`);
    }
  };

  // Mark all lessons as complete
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [markingModuleId, setMarkingModuleId] = useState<string | null>(null);

  const handleMarkAllComplete = async (moduleId: string, lessonIds: string[]) => {
    setMarkingModuleId(moduleId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error('No active session');

      // Make all requests in parallel
      await Promise.all(
        lessonIds.map(lessonId =>
          fetch(`/api/lessons/${lessonId}/progress`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.session.access_token}`,
            },
            credentials: 'include',
            body: JSON.stringify({
              is_completed: true,
              progress_pct: 100
            })
          })
        )
      );

      // Invalidate cache once after all requests
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      
      toast({
        title: "¡Módulo completado!",
        description: `Se marcaron ${lessonIds.length} lecciones como completadas`,
      });
    } catch (error) {
      console.error('Error marking lessons complete:', error);
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las lecciones como completadas",
        variant: "destructive",
      });
    } finally {
      setMarkingModuleId(null);
    }
  };

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    );
  }

  if (structureLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">Este curso aún no tiene contenido</p>
        <p className="text-sm text-muted-foreground/70">
          El contenido estará disponible pronto
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-4 py-6 md:px-6">
      {/* Mobile: Inline header */}
      <ContentHeader
        totalModules={stats.totalModules}
        totalLessons={stats.totalLessons}
        completedLessons={stats.completedLessons}
        totalDurationMin={stats.totalDurationMin}
        variant="inline"
      />

      {/* Desktop: Two columns - Sidebar left, Modules right */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Left sidebar - visible only on desktop */}
        <ContentHeader
          totalModules={stats.totalModules}
          totalLessons={stats.totalLessons}
          completedLessons={stats.completedLessons}
          totalDurationMin={stats.totalDurationMin}
          variant="sidebar"
        />

        {/* Modules list */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <ModuleSection
              key={module.id}
              moduleId={module.id}
              moduleTitle={module.title}
              moduleIndex={index}
              lessons={module.lessons}
              imageUrl={module.imageUrl}
              isExpanded={expandedModuleId === module.id}
              isActive={module.id === activeModuleId}
              nextRecommendedLessonId={nextRecommendedLessonId}
              onGoToLesson={handleGoToLesson}
              onToggle={() => handleToggleModule(module.id)}
              onMarkAllComplete={(lessonIds) => handleMarkAllComplete(module.id, lessonIds)}
              isMarkingComplete={markingModuleId === module.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
