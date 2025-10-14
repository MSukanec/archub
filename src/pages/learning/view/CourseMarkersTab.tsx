import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Bookmark, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import MarkerCard from '@/components/ui/cards/MarkerCard';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();

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

  // Group markers by module for hierarchical display
  const groupedMarkers = useMemo(() => {
    const groups = new Map<string, { module: { title: string; sort_index: number }, markers: MarkerWithLesson[] }>();
    
    filteredMarkers.forEach(marker => {
      const moduleTitle = marker.module?.title || 'Sin módulo';
      if (!groups.has(moduleTitle)) {
        groups.set(moduleTitle, {
          module: marker.module || { title: 'Sin módulo', sort_index: 999 },
          markers: []
        });
      }
      groups.get(moduleTitle)!.markers.push(marker);
    });

    // Convert to array and sort by module sort_index
    return Array.from(groups.values()).sort((a, b) => a.module.sort_index - b.module.sort_index);
  }, [filteredMarkers]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete marker mutation
  const deleteMarkerMutation = useMutation({
    mutationFn: async (markerId: string) => {
      if (!supabase) throw new Error('Supabase no disponible');

      const { error } = await supabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', markerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-markers', courseId] });
      toast({
        title: "Marcador eliminado",
        description: "El marcador se eliminó correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting marker:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el marcador",
        variant: "destructive",
      });
    }
  });

  const handleDeleteMarker = (marker: MarkerWithLesson) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar Marcador',
      description: '¿Estás seguro de que querés eliminar este marcador?',
      itemName: marker.body || 'Marcador sin descripción',
      onConfirm: () => deleteMarkerMutation.mutate(marker.id)
    });
  };

  const handleGoToLesson = (lessonId: string, timeSec: number | null) => {
    console.log('🔗 handleGoToLesson EJECUTADO:', { lessonId, timeSec, courseSlug });
    
    // Set the current lesson in the sidebar
    setCurrentLesson(lessonId);
    
    // Update URL with deep link params (for browser navigation and refresh support)
    if (courseSlug) {
      const params = new URLSearchParams();
      params.set('tab', 'Lecciones');
      params.set('lesson', lessonId);
      if (timeSec !== null) {
        params.set('seek', timeSec.toString());
      }
      navigate(`/learning/courses/${courseSlug}?${params.toString()}`);
    }
    
    // Use the store to navigate (this will switch to "Lecciones" tab and set pending seek)
    goToLesson(lessonId, timeSec);
    
    console.log('🔗 Navegación completada vía store y URL');
  };

  const columns = [
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
      width: '20%',
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
      width: '30%',
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
      width: '25%',
      render: (marker: MarkerWithLesson) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleGoToLesson(marker.lesson_id, marker.time_sec);
            }}
            className="gap-2"
            data-testid={`button-go-to-lesson-${marker.id}`}
          >
            Ir a lección
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteMarker(marker);
            }}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            data-testid={`button-delete-marker-${marker.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredMarkers.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6" data-testid="course-markers-tab">
      {/* Desktop View - Hierarchical Table */}
      <div className="hidden lg:block">
        <div className="rounded-lg border bg-card">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Marcadores del Curso</h3>
            </div>
            <div className="flex items-center gap-2">
              {modules.length > 1 && (
                <Button
                  variant={selectedModule === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedModule('all')}
                >
                  Todos los módulos
                </Button>
              )}
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[25%_20%_30%_25%] gap-4 px-4 py-3 border-b bg-muted/10">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Lección</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Tiempo</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Texto</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Acciones</div>
          </div>

          {/* Hierarchical Content */}
          <div className="divide-y">
            {groupedMarkers.map((group) => (
              <div key={group.module.title}>
                {/* Module Header Row */}
                <div className="bg-muted/30 px-4 py-3 font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                  {group.module.title}
                  <Badge variant="outline" className="ml-auto">
                    {group.markers.length} {group.markers.length === 1 ? 'marcador' : 'marcadores'}
                  </Badge>
                </div>

                {/* Markers Table */}
                <div className="divide-y">
                  {group.markers.map((marker) => (
                    <div 
                      key={marker.id} 
                      className="grid grid-cols-[25%_20%_30%_25%] gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
                      data-testid={`marker-row-${marker.id}`}
                    >
                      {/* Lección */}
                      <div className="font-medium text-sm">
                        {marker.lesson?.title || 'Sin lección'}
                      </div>
                      
                      {/* Tiempo */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {formatTime(marker.time_sec)}
                        </span>
                      </div>
                      
                      {/* Texto */}
                      <div className="flex items-start gap-2 text-sm">
                        {marker.is_pinned && (
                          <Badge variant="secondary" className="shrink-0">
                            Fijado
                          </Badge>
                        )}
                        <span className={marker.body ? '' : 'text-muted-foreground italic'}>
                          {marker.body || 'Sin descripción'}
                        </span>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleGoToLesson(marker.lesson_id, marker.time_sec);
                          }}
                          className="gap-2"
                          data-testid={`button-go-to-lesson-${marker.id}`}
                        >
                          Ir a lección
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteMarker(marker);
                          }}
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-marker-${marker.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {/* Mobile Filter */}
        {modules.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <Button
              variant={selectedModule === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModule('all')}
            >
              Todos
            </Button>
            {modules.map((module) => (
              <Button
                key={module.title}
                variant={selectedModule === module.title ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModule(module.title)}
              >
                {module.title}
              </Button>
            ))}
          </div>
        )}

        {/* Mobile Cards - Grouped by Module */}
        <div className="space-y-4">
          {groupedMarkers.map((group) => (
            <div key={group.module.title} className="space-y-2">
              {/* Module Header for Mobile */}
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-md">
                <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-semibold text-sm">{group.module.title}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {group.markers.length}
                </Badge>
              </div>
              
              {/* Markers */}
              <div className="space-y-3">
                {group.markers.map((marker) => (
                  <MarkerCard
                    key={marker.id}
                    marker={marker}
                    onGoToLesson={handleGoToLesson}
                    onDelete={handleDeleteMarker}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
