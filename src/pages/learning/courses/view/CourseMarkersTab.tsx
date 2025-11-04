import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Bookmark, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MarkerRow } from '@/components/ui/data-row/rows';

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

  // Fetch all markers for the course with lesson and module information (OPTIMIZED)
  const { data: markers = [], isLoading } = useQuery<MarkerWithLesson[]>({
    queryKey: [`/api/courses/${courseId}/markers`],
    enabled: !!courseId
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

  // Add moduleTitle property to markers for grouping
  const markersWithModuleTitle = useMemo(() => {
    return filteredMarkers.map(marker => ({
      ...marker,
      moduleTitle: marker.module?.title || 'Sin módulo',
      moduleSortIndex: marker.module?.sort_index || 999
    }));
  }, [filteredMarkers]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete marker mutation (OPTIMIZED)
  const deleteMarkerMutation = useMutation({
    mutationFn: async (markerId: string) => {
      const response = await fetch(`/api/notes/${markerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete marker');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/markers`] });
      toast({
        title: "Marcador eliminado",
        description: "El marcador se eliminó correctamente",
      });
    },
    onError: (error) => {
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
    // Set the current lesson in the sidebar
    setCurrentLesson(lessonId);
    
    // Update URL with deep link params (for browser navigation and refresh support)
    if (courseSlug) {
      const params = new URLSearchParams();
      params.set('tab', 'Reproductor');
      params.set('lesson', lessonId);
      if (timeSec !== null) {
        params.set('seek', timeSec.toString());
      }
      navigate(`/learning/courses/${courseSlug}?${params.toString()}`);
    }
    
    // Use the store to navigate (this will switch to "Reproductor" tab and set pending seek)
    goToLesson(lessonId, timeSec);
  };

  // Render module group header
  const renderModuleGroupHeader = (moduleName: string, groupMarkers: any[]) => {
    const markersCount = groupMarkers.length;
    return (
      <div 
        className="px-4 py-2 text-xs font-medium font-bold"
        style={{ 
          backgroundColor: "var(--table-group-header-bg)",
          color: "white"
        }}
      >
        {moduleName} ({markersCount} {markersCount === 1 ? 'marcador' : 'marcadores'})
      </div>
    );
  };

  const columns = [
    {
      key: 'lesson',
      label: 'Lección',
      sortable: true,
      sortType: 'string' as const,
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
            onClick={() => navigate(`/learning/courses/${courseSlug}?tab=Reproductor`)}
            data-testid="button-go-to-lessons"
          >
            Ir a Reproductor
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="course-markers-tab">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <Table
          data={markersWithModuleTitle}
          columns={columns}
          groupBy="moduleTitle"
          rowActions={(marker) => [
            {
              icon: ArrowRight,
              label: 'Ir a lección',
              onClick: () => handleGoToLesson(marker.lesson_id, marker.time_sec)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteMarker(marker),
              variant: 'destructive' as const
            }
          ]}
          renderGroupHeader={renderModuleGroupHeader}
          topBar={{
            showSearch: true,
            showFilter: true,
            renderFilterContent: renderFilterContent,
            isFilterActive: selectedModule !== 'all'
          }}
          emptyState={
            <EmptyState
              icon={<Bookmark />}
              title="No hay marcadores"
              description="Los marcadores que crees en las lecciones aparecerán aquí"
              action={
                <Button
                  onClick={() => navigate(`/learning/courses/${courseSlug}?tab=Reproductor`)}
                  data-testid="button-go-to-lessons"
                >
                  Ir a Reproductor
                </Button>
              }
            />
          }
        />
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
          {Object.entries(
            markersWithModuleTitle.reduce((acc, marker) => {
              const moduleTitle = marker.moduleTitle;
              if (!acc[moduleTitle]) {
                acc[moduleTitle] = [];
              }
              acc[moduleTitle].push(marker);
              return acc;
            }, {} as Record<string, typeof markersWithModuleTitle>)
          )
          .sort((a, b) => {
            const moduleA = a[1][0]?.moduleSortIndex || 999;
            const moduleB = b[1][0]?.moduleSortIndex || 999;
            return moduleA - moduleB;
          })
          .map(([moduleTitle, moduleMarkers]) => (
            <div key={moduleTitle}>
              {/* Module Header for Mobile */}
              <div className="px-4 py-2 mb-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: "var(--table-group-header-bg)", color: "white" }}>
                {moduleTitle} ({moduleMarkers.length})
              </div>
              {/* Module Cards */}
              <div className="space-y-0">
                {moduleMarkers.map((marker) => (
                  <MarkerRow
                    key={marker.id}
                    marker={{
                      id: marker.id,
                      lesson_title: marker.lesson?.title || 'Sin lección',
                      module_title: marker.module?.title || 'Sin módulo',
                      time_sec: marker.time_sec,
                      body: marker.body
                    }}
                    onGoToMarker={() => handleGoToLesson(marker.lesson_id, marker.time_sec)}
                    onDelete={() => handleDeleteMarker(marker)}
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
