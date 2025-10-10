import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Bookmark, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

interface CourseMarkersTabProps {
  courseId: string;
  courseSlug?: string;
}

interface MarkerWithLesson {
  id: string;
  user_id: string;
  lesson_id: string;
  body: string;
  time_sec: number | null;
  is_pinned: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
  lesson?: {
    title: string;
    module_id: string;
  };
  module?: {
    title: string;
    sort_index: number;
  };
}

export default function CourseMarkersTab({ courseId, courseSlug }: CourseMarkersTabProps) {
  const [, navigate] = useLocation();
  const { setCurrentLesson } = useCourseSidebarStore();
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Fetch all markers for the course with lesson and module information
  const { data: markers = [], isLoading } = useQuery({
    queryKey: ['course-markers', courseId],
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

      // First, get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return [];

      const moduleIds = courseModules.map(m => m.id);

      // Then get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id, module_id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return [];

      const lessonIds = courseLessons.map(l => l.id);

      // Finally, get all markers for these lessons
      const { data: markersData, error } = await supabase
        .from('course_lesson_notes')
        .select(`
          *,
          lesson:course_lessons!inner(
            title,
            module_id
          )
        `)
        .eq('user_id', userRecord.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching markers:', error);
        return [];
      }

      // Get module info for each marker
      const enrichedMarkers = await Promise.all(
        (markersData || []).map(async (marker) => {
          const { data: moduleData } = await supabase
            .from('course_modules')
            .select('title, sort_index')
            .eq('id', marker.lesson?.module_id)
            .single();

          return {
            ...marker,
            module: moduleData
          };
        })
      );

      return enrichedMarkers as MarkerWithLesson[];
    },
    enabled: !!courseId && !!supabase
  });

  // Get unique modules from markers
  const modules = useMemo(() => {
    const uniqueModules = new Map<string, { title: string; sort_index: number }>();
    
    markers.forEach(marker => {
      if (marker.module) {
        const moduleKey = marker.module.title;
        if (!uniqueModules.has(moduleKey)) {
          uniqueModules.set(moduleKey, marker.module);
        }
      }
    });

    return Array.from(uniqueModules.values()).sort((a, b) => a.sort_index - b.sort_index);
  }, [markers]);

  // Filter markers by selected module
  const filteredMarkers = useMemo(() => {
    if (selectedModule === 'all') return markers;
    return markers.filter(marker => marker.module?.title === selectedModule);
  }, [markers, selectedModule]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoToLesson = (lessonId: string, timeSec: number | null) => {
    // Set the current lesson in the sidebar
    setCurrentLesson(lessonId);
    
    // Navigate to the Lecciones tab with query params for time
    if (timeSec !== null) {
      navigate(`/learning/courses/${courseSlug}?tab=Lecciones&lesson=${lessonId}&seek=${timeSec}`);
    } else {
      navigate(`/learning/courses/${courseSlug}?tab=Lecciones&lesson=${lessonId}`);
    }
  };

  const columns = [
    {
      key: 'module',
      label: 'Módulo',
      sortable: true,
      sortType: 'string' as const,
      width: '20%',
      render: (marker: MarkerWithLesson) => (
        <div className="font-medium">
          {marker.module?.title || 'Sin módulo'}
        </div>
      )
    },
    {
      key: 'lesson',
      label: 'Lección',
      sortable: true,
      sortType: 'string' as const,
      width: '25%',
      render: (marker: MarkerWithLesson) => (
        <div className="font-medium">
          {marker.lesson?.title || 'Sin lección'}
        </div>
      )
    },
    {
      key: 'time_sec',
      label: 'Tiempo',
      sortable: true,
      sortType: 'number' as const,
      width: '10%',
      render: (marker: MarkerWithLesson) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">
            {formatTime(marker.time_sec)}
          </span>
        </div>
      )
    },
    {
      key: 'body',
      label: 'Texto',
      sortable: false,
      width: '35%',
      render: (marker: MarkerWithLesson) => (
        <div className="flex items-start gap-2">
          {marker.is_pinned && (
            <Badge variant="secondary" className="shrink-0">
              Fijado
            </Badge>
          )}
          <span className={marker.body ? '' : 'text-muted-foreground italic'}>
            {marker.body || 'Sin descripción'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      width: '10%',
      render: (marker: MarkerWithLesson) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleGoToLesson(marker.lesson_id, marker.time_sec)}
          className="gap-2"
          data-testid={`button-go-to-lesson-${marker.id}`}
        >
          Ir a lección
          <ArrowRight className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const renderFilterContent = () => {
    return (
      <>
        <div className="text-xs font-medium mb-2 block">Filtrar por módulo</div>
        <div className="space-y-1">
          <Button
            variant={selectedModule === 'all' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedModule('all')}
            className="w-full justify-start text-xs font-normal h-8"
          >
            Todos los módulos
          </Button>
          {modules.map((module) => (
            <Button
              key={module.title}
              variant={selectedModule === module.title ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedModule(module.title)}
              className="w-full justify-start text-xs font-normal h-8"
            >
              {module.title}
            </Button>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6" data-testid="course-markers-tab">
      <Table
        columns={columns}
        data={filteredMarkers}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={<Bookmark />}
            title="No hay marcadores"
            description="Los marcadores que crees en las lecciones aparecerán aquí"
            action={
              <Button
                onClick={() => navigate(`/learning/courses/${courseSlug}?tab=Lecciones`)}
                data-testid="button-go-to-lessons"
              >
                Ir a Lecciones
              </Button>
            }
          />
        }
        defaultSort={{
          key: 'created_at',
          direction: 'desc'
        }}
        getItemId={(marker) => marker.id}
        topBar={modules.length > 0 ? {
          showSearch: false,
          showFilter: true,
          renderFilterContent: renderFilterContent,
          isFilterActive: selectedModule !== 'all',
          onClearFilters: () => setSelectedModule('all')
        } : undefined}
      />
    </div>
  );
}
