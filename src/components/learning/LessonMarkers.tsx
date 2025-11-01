import { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Trash2, Pin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { CourseLessonNote } from '@shared/schema';

interface LessonMarkersProps {
  lessonId: string;
  vimeoPlayer: any | null;
}

interface MarkerWithSaveStatus extends CourseLessonNote {
  isSaving?: boolean;
}

export function LessonMarkers({ lessonId, vimeoPlayer }: LessonMarkersProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch markers with React Query (optimized backend endpoint)
  const { data: markers = [], isLoading } = useQuery<CourseLessonNote[]>({
    queryKey: ['/api/lessons', lessonId, 'markers'],
    enabled: !!lessonId,
    staleTime: 10000, // Cache for 10 seconds
  });

  // Track current video time
  useEffect(() => {
    if (!vimeoPlayer) return;

    const updateTime = async () => {
      try {
        const time = await vimeoPlayer.getCurrentTime();
        setCurrentTime(Math.floor(time));
      } catch (error) {
        console.error('Error getting current time:', error);
      }
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

  // Create marker mutation
  const createMarkerMutation = useMutation({
    mutationFn: async (time_sec: number) => {
      return apiRequest('POST', `/api/lessons/${lessonId}/markers`, {
        body: '',
        time_sec
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', lessonId, 'markers'] });
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

  // Update marker mutation
  const updateMarkerMutation = useMutation({
    mutationFn: async ({ markerId, body, is_pinned }: { markerId: string; body?: string; is_pinned?: boolean }) => {
      return apiRequest('PATCH', `/api/lessons/${lessonId}/markers/${markerId}`, {
        ...(body !== undefined && { body }),
        ...(is_pinned !== undefined && { is_pinned })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', lessonId, 'markers'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el marcador',
        variant: 'destructive'
      });
    }
  });

  // Delete marker mutation
  const deleteMarkerMutation = useMutation({
    mutationFn: async (markerId: string) => {
      return apiRequest('DELETE', `/api/lessons/${lessonId}/markers/${markerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', lessonId, 'markers'] });
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
    if (!vimeoPlayer) return;

    try {
      const time = await vimeoPlayer.getCurrentTime();
      const roundedTime = Math.floor(time);

      // Check if marker already exists at this time
      const existingMarker = markers.find(m => m.time_sec === roundedTime);
      if (existingMarker) {
        toast({
          title: 'Marcador ya existe',
          description: `Ya hay un marcador en ${formatTime(roundedTime)}`,
          variant: 'default'
        });
        return;
      }

      createMarkerMutation.mutate(roundedTime);
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  const handleBodyChange = (markerId: string, newBody: string) => {
    // Clear existing timer for this marker
    const existingTimer = debounceTimersRef.current.get(markerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Optimistic update in cache
    queryClient.setQueryData<CourseLessonNote[]>(
      ['/api/lessons', lessonId, 'markers'],
      (old = []) => old.map(m => m.id === markerId ? { ...m, body: newBody } : m)
    );

    // Set new timer for debounced save
    const timer = setTimeout(() => {
      updateMarkerMutation.mutate({ markerId, body: newBody });
      debounceTimersRef.current.delete(markerId);
    }, 600);

    debounceTimersRef.current.set(markerId, timer);
  };

  const handleSeekTo = async (timeSec: number | null) => {
    if (!vimeoPlayer || timeSec === null) return;

    try {
      await vimeoPlayer.setCurrentTime(timeSec);
      toast({
        title: 'Posición actualizada',
        description: `Saltando a ${formatTime(timeSec)}`
      });
    } catch (error) {
      console.error('Error seeking to time:', error);
    }
  };

  const handleTogglePin = (markerId: string, currentPinned: boolean) => {
    updateMarkerMutation.mutate({ markerId, is_pinned: !currentPinned });
  };

  const handleDeleteMarker = (markerId: string) => {
    deleteMarkerMutation.mutate(markerId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted/20 rounded-lg"></div>
        <div className="h-20 bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="lesson-markers-container">
      <div className="flex justify-end">
        <Button
          onClick={handleAddMarker}
          size="sm"
          variant="default"
          className="gap-2"
          disabled={!vimeoPlayer || createMarkerMutation.isPending}
          data-testid="button-add-marker"
        >
          <Plus className="h-4 w-4" />
          <span>en {formatTime(currentTime)}</span>
        </Button>
      </div>

      {markers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay marcadores aún</p>
          <p className="text-xs mt-1">Agrega tu primer marcador en el tiempo actual</p>
        </div>
      ) : (
        <div className="space-y-2">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              data-testid={`marker-${marker.id}`}
            >
              <div className="flex items-center gap-2 min-w-[60px]">
                {marker.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium">
                  {formatTime(marker.time_sec)}
                </span>
              </div>

              <div className="flex-1">
                <Input
                  value={marker.body}
                  onChange={(e) => handleBodyChange(marker.id, e.target.value)}
                  placeholder="Descripción del marcador..."
                  className="h-9"
                  data-testid={`marker-input-${marker.id}`}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSeekTo(marker.time_sec)}
                  className="h-8 px-2"
                  data-testid={`button-seek-${marker.id}`}
                >
                  Ir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePin(marker.id, marker.is_pinned)}
                  className="h-8 px-2"
                  disabled={updateMarkerMutation.isPending}
                  data-testid={`button-pin-${marker.id}`}
                >
                  <Pin className={`h-4 w-4 ${marker.is_pinned ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteMarker(marker.id)}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  disabled={deleteMarkerMutation.isPending}
                  data-testid={`button-delete-${marker.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
