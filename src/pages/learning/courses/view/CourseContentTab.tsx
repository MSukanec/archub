import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import { useCoursePlayerStore } from '@/stores/coursePlayerStore'
import LessonRow from '@/components/ui/data-row/rows/LessonRow'
import { FavoriteButton } from '@/components/learning/FavoriteButton'

interface CourseContentTabProps {
  courseId?: string;
  courseSlug?: string;
}

interface LessonRowData {
  id: string;
  title: string;
  duration_sec: number | null;
  module_id: string;
  module_title: string;
  module_sort_index: number;
  notes_count: number;
  markers_count: number;
  is_completed: boolean;
  is_favorite: boolean; // 🌟 NUEVO: Estado de favorito
  groupKey: string; // Para el groupBy
}

export default function CourseContentTab({ courseId, courseSlug }: CourseContentTabProps) {
  const [, navigate] = useLocation()
  const { setCurrentLesson } = useCourseSidebarStore()
  const goToLesson = useCoursePlayerStore(s => s.goToLesson)

  // Get course modules
  const { data: modules = [] } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_index', { ascending: true });
        
      if (error) {
        console.error('Error fetching course modules:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  // Get lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!courseId || !supabase || modules.length === 0) return [];
      
      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_index', { ascending: true});
        
      if (error) {
        console.error('Error fetching lessons:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase && modules.length > 0
  });

  // Get all progress for the current course
  const { data: courseProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!courseId && !!supabase,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Get notes count per lesson
  const { data: notesData = [] } = useQuery({
    queryKey: ['course-lesson-notes-count', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .ilike('email', authUser.email)
        .single();

      if (!userRecord) return [];

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return [];

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return [];

      const lessonIds = courseLessons.map(l => l.id);

      // Get notes count per lesson
      const { data, error } = await supabase
        .from('course_lesson_notes')
        .select('lesson_id, note_type')
        .eq('user_id', userRecord.id)
        .in('lesson_id', lessonIds);

      if (error) return [];
      
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  // Process data into rows
  const tableData = useMemo<LessonRowData[]>(() => {
    if (!lessons.length || !modules.length) return [];

    // Count notes and markers per lesson
    const notesCountMap: Record<string, { notes: number; markers: number }> = {};
    notesData.forEach((note) => {
      if (!notesCountMap[note.lesson_id]) {
        notesCountMap[note.lesson_id] = { notes: 0, markers: 0 };
      }
      if (note.note_type === 'marker') {
        notesCountMap[note.lesson_id].markers++;
      } else {
        notesCountMap[note.lesson_id].notes++;
      }
    });

    // Build module map
    const moduleMap = modules.reduce((acc, module) => {
      acc[module.id] = module;
      return acc;
    }, {} as Record<string, any>);

    // Map lessons to rows
    const rows: LessonRowData[] = lessons.map((lesson) => {
      const module = moduleMap[lesson.module_id];
      const progress = courseProgress.find((p: any) => p.lesson_id === lesson.id);
      const isCompleted = progress?.is_completed || false;
      const isFavorite = progress?.is_favorite || false; // 🌟 NUEVO: Obtener estado de favorito
      const counts = notesCountMap[lesson.id] || { notes: 0, markers: 0 };

      return {
        id: lesson.id,
        title: lesson.title,
        duration_sec: lesson.duration_sec,
        module_id: lesson.module_id,
        module_title: module?.title || 'Sin módulo',
        module_sort_index: module?.sort_index || 0,
        notes_count: counts.notes,
        markers_count: counts.markers,
        is_completed: isCompleted,
        is_favorite: isFavorite, // 🌟 NUEVO: Incluir en el row
        groupKey: module?.title || 'Sin módulo'
      };
    });

    // Sort by module sort_index and then by lesson order
    rows.sort((a, b) => {
      if (a.module_sort_index !== b.module_sort_index) {
        return a.module_sort_index - b.module_sort_index;
      }
      // Within same module, maintain lesson order
      const aLessonIndex = lessons.findIndex(l => l.id === a.id);
      const bLessonIndex = lessons.findIndex(l => l.id === b.id);
      return aLessonIndex - bLessonIndex;
    });

    return rows;
  }, [lessons, modules, courseProgress, notesData]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const totalMins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${totalMins}:${secs.toString().padStart(2, '0')}`;
  }

  const handleGoToLesson = (lessonId: string) => {
    // Set the current lesson in the sidebar
    setCurrentLesson(lessonId);
    
    // Use the store to navigate (this will switch to "Lecciones" tab and set the lesson)
    goToLesson(lessonId, null);
    
    // Update URL with deep link params (for browser navigation and refresh support)
    if (courseSlug) {
      const params = new URLSearchParams();
      params.set('tab', 'Lecciones');
      params.set('lesson', lessonId);
      navigate(`/learning/courses/${courseSlug}?${params.toString()}`);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Nombre',
      width: '30%',
      render: (row: LessonRowData) => (
        <span className="font-medium">{row.title}</span>
      )
    },
    {
      key: 'duration_sec',
      label: 'Duración',
      width: '12%',
      render: (row: LessonRowData) => (
        <span className="text-sm">{formatDuration(row.duration_sec)}</span>
      )
    },
    {
      key: 'notes_count',
      label: 'Notas',
      width: '10%',
      render: (row: LessonRowData) => (
        <span className="text-sm">{row.notes_count}</span>
      )
    },
    {
      key: 'markers_count',
      label: 'Marcadores',
      width: '12%',
      render: (row: LessonRowData) => (
        <span className="text-sm">{row.markers_count}</span>
      )
    },
    {
      key: 'is_completed',
      label: 'Completada',
      width: '16%',
      render: (row: LessonRowData) => (
        row.is_completed ? (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <Circle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '20%',
      sortable: false,
      render: (row: LessonRowData) => (
        <div className="flex items-center gap-2">
          {/* 🌟 BOTÓN DE FAVORITO */}
          <FavoriteButton 
            lessonId={row.id}
            courseId={courseId!}
            isFavorite={row.is_favorite}
            variant="icon"
            size="md"
          />
          
          {/* BOTÓN IR A LECCIÓN */}
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleGoToLesson(row.id);
            }}
            data-testid={`button-go-to-lesson-${row.id}`}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Ir a Lección
          </Button>
        </div>
      )
    }
  ];

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Table
        data={tableData}
        columns={columns}
        groupBy="groupKey"
        renderGroupHeader={(groupKey: string, groupRows: LessonRowData[]) => (
          <div className="col-span-full text-sm font-semibold py-2">
            {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'lección' : 'lecciones'})
          </div>
        )}
        renderCard={(row: LessonRowData) => (
          <LessonRow
            lesson={row}
            courseId={courseId!}
            onGoToLesson={handleGoToLesson}
          />
        )}
        emptyStateConfig={{
          title: 'No hay lecciones',
          description: 'Este curso no tiene lecciones disponibles'
        }}
      />
    </div>
  )
}
