/**
 * CourseContentTab.tsx
 * 
 * Course Structure Explorer - Premium learning experience
 * Replaces the previous table-based view with a modern, visual module explorer
 */
import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { 
  ContentHeader, 
  ModuleSection,
  useCourseStructure, 
  useCourseProgress, 
  useCoursePlayerStore 
} from '@/features/learning';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

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
  lessons: LessonData[];
}

export default function CourseContentTab({ courseId, courseSlug }: CourseContentTabProps) {
  const [, navigate] = useLocation();
  const { setCurrentLesson } = useCourseSidebarStore();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);

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
        lessons: moduleLessons
      };
    }).sort((a, b) => a.sort_index - b.sort_index);
  }, [courseStructure, courseProgress, notesResponse, markersResponse]);

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

  const stats = useMemo(() => {
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (acc, m) => acc + m.lessons.filter(l => l.is_completed).length, 
      0
    );
    return {
      totalModules: modules.length,
      totalLessons,
      completedLessons
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
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6">
      <ContentHeader
        totalModules={stats.totalModules}
        totalLessons={stats.totalLessons}
        completedLessons={stats.completedLessons}
      />

      <div className="space-y-4">
        {modules.map((module, index) => (
          <ModuleSection
            key={module.id}
            moduleId={module.id}
            moduleTitle={module.title}
            moduleIndex={index}
            lessons={module.lessons}
            courseId={courseId}
            isActive={module.id === activeModuleId}
            nextRecommendedLessonId={nextRecommendedLessonId}
            onGoToLesson={handleGoToLesson}
          />
        ))}
      </div>
    </div>
  );
}
