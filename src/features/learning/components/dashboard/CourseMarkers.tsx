import { useRef, useState, useEffect } from 'react';
import { Bookmark, Clock, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getCourseMarkersUrl, type MarkerWithLesson } from '../../services/student/getCourseMarkers';
import type Player from '@vimeo/player';
interface CourseMarkersProps {
  courseId: string;
  activeLessonId: string | null;
  vimeoPlayer?: Player | null;
  onLessonSelect: (lessonId: string, timeSec: number | null) => void;
}
export function CourseMarkers({ 
  courseId, 
  activeLessonId, 
  vimeoPlayer, 
  onLessonSelect 
}: CourseMarkersProps) {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(0);
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { data: markers = [], isLoading } = useQuery<MarkerWithLesson[]>({
    queryKey: [getCourseMarkersUrl(courseId)],
    enabled: !!courseId,
    staleTime: 0,
  });
  useEffect(() => {
    if (!vimeoPlayer) return;
    const updateTime = async () => {
      try {
        const time = await vimeoPlayer.getCurrentTime();
        setCurrentTime(Math.floor(time));
      } catch (error) {}
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [vimeoPlayer]);
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const createMarkerMutation = useMutation({
    mutationFn: async (time_sec: number) => {
      if (!activeLessonId) throw new Error('No active lesson');
      return apiRequest('POST', `/api/lessons/${activeLessonId}/markers`, {
        body: '',
        time_sec
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getCourseMarkersUrl(courseId)] });
      if (activeLessonId) {
        queryClient.invalidateQueries({ queryKey: [`/api/lessons/${activeLessonId}/markers`] });
      }
      toast({
        title: 'Marcador agregado',
        description: `Marcador creado en ${formatTime(currentTime)}`
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el marcador',
        variant: 'destructive'
      });
    }
  });
  const updateMarkerMutation = useMutation({
    mutationFn: async ({ lessonId, markerId, body }: { lessonId: string; markerId: string; body: string }) => {
      return apiRequest('PATCH', `/api/lessons/${lessonId}/markers/${markerId}`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getCourseMarkersUrl(courseId)] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el marcador',
        variant: 'destructive'
      });
    }
  });
  const deleteMarkerMutation = useMutation({
    mutationFn: async ({ lessonId, markerId }: { lessonId: string; markerId: string }) => {
      return apiRequest('DELETE', `/api/lessons/${lessonId}/markers/${markerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getCourseMarkersUrl(courseId)] });
      toast({
        title: 'Marcador eliminado',
        description: 'El marcador se eliminó correctamente'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el marcador',
        variant: 'destructive'
      });
    }
  });
  const handleAddMarker = async () => {
    if (!vimeoPlayer || !activeLessonId) return;
    try {
      const time = await vimeoPlayer.getCurrentTime();
      const roundedTime = Math.floor(time);
      createMarkerMutation.mutate(roundedTime);
    } catch (error) {}
  };
  const handleBodyChange = (marker: MarkerWithLesson, newBody: string) => {
    const existingTimer = debounceTimersRef.current.get(marker.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    queryClient.setQueryData<MarkerWithLesson[]>(
      [getCourseMarkersUrl(courseId)],
      (old = []) => old.map(m => m.id === marker.id ? { ...m, body: newBody } : m)
    );
    const timer = setTimeout(() => {
      updateMarkerMutation.mutate({ lessonId: marker.lesson_id, markerId: marker.id, body: newBody });
      debounceTimersRef.current.delete(marker.id);
    }, 600);
    debounceTimersRef.current.set(marker.id, timer);
  };
  const handleSeekTo = async (marker: MarkerWithLesson) => {
    if (marker.lesson_id === activeLessonId && vimeoPlayer && marker.time_sec !== null) {
      try {
        await vimeoPlayer.setCurrentTime(marker.time_sec);
      } catch (error) {}
    } else {
      onLessonSelect(marker.lesson_id, marker.time_sec);
    }
  };
  const handleDeleteMarker = (marker: MarkerWithLesson) => {
    deleteMarkerMutation.mutate({ lessonId: marker.lesson_id, markerId: marker.id });
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="course-markers-container">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-medium">Marcadores</span>
        </div>
        {activeLessonId && (
          <Button
            onClick={handleAddMarker}
            size="sm"
            variant="default"
            className="gap-1.5 h-7 text-xs"
            disabled={!vimeoPlayer || createMarkerMutation.isPending}
            data-testid="button-add-marker"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{formatTime(currentTime)}</span>
          </Button>
        )}
      </div>
      {markers.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No hay marcadores aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={cn(
                "p-2.5 rounded-lg border transition-colors space-y-1.5",
                marker.lesson_id === activeLessonId 
                  ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" 
                  : "border-border hover:bg-muted/50"
              )}
              data-testid={`marker-${marker.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {marker.lesson?.title || 'Lección'}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {marker.module?.title || 'Módulo'}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1">
                    {formatTime(marker.time_sec)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleSeekTo(marker)}
                    data-testid={`button-seek-${marker.id}`}
                    title="Ir a este momento"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteMarker(marker)}
                    disabled={deleteMarkerMutation.isPending}
                    data-testid={`button-delete-${marker.id}`}
                    title="Eliminar marcador"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={marker.body || ''}
                onChange={(e) => handleBodyChange(marker, e.target.value)}
                placeholder="Agregar nota..."
                className="min-h-[40px] text-xs resize-none p-2"
                data-testid={`textarea-marker-${marker.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
