import { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Trash2, Pin, Clock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { CourseLessonNote } from '@shared/schema';

interface LessonMarkersProps {
  lessonId: string;
  vimeoPlayer: any | null;
}

interface MarkerWithSaveStatus extends CourseLessonNote {
  isSaving?: boolean;
}

export function LessonMarkers({ lessonId, vimeoPlayer }: LessonMarkersProps) {
  const [markers, setMarkers] = useState<MarkerWithSaveStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .ilike('email', authUser.email)
        .single();

      if (userRecord) {
        setUserId(userRecord.id);
      }
    };

    getUserId();
  }, []);

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

  // Load markers
  useEffect(() => {
    const loadMarkers = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('course_lesson_notes')
          .select('*')
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .eq('note_type', 'marker')
          .order('is_pinned', { ascending: false })
          .order('time_sec', { ascending: true })
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMarkers(data || []);
      } catch (error) {
        console.error('Error loading markers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarkers();
  }, [lessonId, userId]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMarker = async () => {
    if (!userId || !vimeoPlayer) return;

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

      const { data, error } = await supabase
        .from('course_lesson_notes')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          note_type: 'marker',
          body: '',
          time_sec: roundedTime,
          is_pinned: false
        })
        .select()
        .single();

      if (error) throw error;

      setMarkers(prev => {
        const updated = [...prev, data];
        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
          if (a.time_sec !== b.time_sec) return (a.time_sec || 0) - (b.time_sec || 0);
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      });

      toast({
        title: 'Marcador agregado',
        description: `Marcador creado en ${formatTime(roundedTime)}`
      });
    } catch (error) {
      console.error('Error adding marker:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el marcador',
        variant: 'destructive'
      });
    }
  };

  const handleBodyChange = (markerId: string, newBody: string) => {
    // Update local state immediately
    setMarkers(prev => prev.map(m => 
      m.id === markerId ? { ...m, body: newBody, isSaving: true } : m
    ));

    // Clear existing timer for this marker
    const existingTimer = debounceTimersRef.current.get(markerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('course_lesson_notes')
          .update({ body: newBody })
          .eq('id', markerId);

        if (error) throw error;

        setMarkers(prev => prev.map(m => 
          m.id === markerId ? { ...m, isSaving: false } : m
        ));
      } catch (error) {
        console.error('Error saving marker body:', error);
        setMarkers(prev => prev.map(m => 
          m.id === markerId ? { ...m, isSaving: false } : m
        ));
      } finally {
        debounceTimersRef.current.delete(markerId);
      }
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

  const handleTogglePin = async (markerId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('course_lesson_notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', markerId);

      if (error) throw error;

      setMarkers(prev => {
        const updated = prev.map(m => 
          m.id === markerId ? { ...m, is_pinned: !currentPinned } : m
        );
        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
          if (a.time_sec !== b.time_sec) return (a.time_sec || 0) - (b.time_sec || 0);
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'No se pudo fijar el marcador',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      const { error } = await supabase
        .from('course_lesson_notes')
        .delete()
        .eq('id', markerId);

      if (error) throw error;

      setMarkers(prev => prev.filter(m => m.id !== markerId));
      
      toast({
        title: 'Marcador eliminado',
        description: 'El marcador se eliminó correctamente'
      });
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el marcador',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-muted rounded"></div>
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
          disabled={!vimeoPlayer}
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

              <div className="flex-1 relative">
                <Input
                  value={marker.body}
                  onChange={(e) => handleBodyChange(marker.id, e.target.value)}
                  placeholder="Descripción del marcador..."
                  className="h-9 pr-8"
                  data-testid={`marker-input-${marker.id}`}
                />
                {marker.isSaving && (
                  <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
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
                  data-testid={`button-pin-${marker.id}`}
                >
                  <Pin className={`h-4 w-4 ${marker.is_pinned ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteMarker(marker.id)}
                  className="h-8 px-2 text-destructive hover:text-destructive"
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
