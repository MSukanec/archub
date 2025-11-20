import { useState, useEffect, useRef } from 'react';
import { BookOpen, Check, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { CourseLessonNote } from '@shared/schema';

interface LessonNotesProps {
  lessonId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const [noteText, setNoteText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const initialNoteTextRef = useRef('');

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (body: string) => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) throw new Error('No session');

      const response = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          body,
          is_pinned: false
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      return response.json();
    },
    onMutate: () => {
      setSaveStatus('saving');
    },
    onSuccess: () => {
      setSaveStatus('saved');
      
      // Invalidar TODAS las queries relacionadas con notas para asegurar que el tab de apuntes se actualice
      // Esto invalida tanto las notas de esta lección como las de todos los cursos
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          // Convertir key a string para buscar patrones
          const keyString = key.join('/');
          
          // Invalidar cualquier query que tenga "notes" en su path
          // Esto cubre: /api/lessons/${lessonId}/notes, /api/courses/${courseId}/notes, etc.
          return keyString.includes('/notes');
        }
      });
      
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 800);
    },
    onError: () => {
      setSaveStatus('error');
    }
  });

  useEffect(() => {
    const loadNote = async () => {
      try {
        setIsLoading(true);
        isInitialLoadRef.current = true;
        // Get session with error handling
        let session = null;
        try {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        } catch (error) {
          // Silently handle auth errors
          return;
        }
        if (!session) return;

        const response = await fetch(`/api/lessons/${lessonId}/notes`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          return;
        }

        const notes: CourseLessonNote[] = await response.json();
        const mainNote = notes.find(note => note.time_sec === null);
        
        if (mainNote) {
          setNoteText(mainNote.body);
          initialNoteTextRef.current = mainNote.body;
        } else {
          setNoteText('');
          initialNoteTextRef.current = '';
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
        // Marcar que la carga inicial terminó después de un pequeño delay
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadNote();
  }, [lessonId]);

  useEffect(() => {
    // No guardar durante la carga inicial
    if (isInitialLoadRef.current) {
      return;
    }

    // No guardar si el texto está vacío y no había nada antes (evita crear notas vacías)
    if (noteText.trim() === '' && initialNoteTextRef.current === '') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Actualizar el texto inicial para futuras comparaciones
      initialNoteTextRef.current = noteText;
      // Usar la mutation para guardar
      saveNoteMutation.mutate(noteText);
    }, 700);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, [noteText, lessonId]);

  const getSaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Guardando...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
            <Check className="h-4 w-4" />
            <span>Guardado</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Error al guardar</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6" data-testid="lesson-notes-container">
      <div className="flex items-center gap-3 mb-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Mis Apuntes</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Los apuntes se guardan automáticamente mientras escribes
      </p>

      <div className="space-y-3">
        <Textarea
          data-testid="notes-textarea"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Escribe tus apuntes aquí... (se guardan automáticamente)"
          className="min-h-[150px] resize-none rounded-lg border-border focus:border-primary transition-colors"
        />
        
        <div className="flex justify-end">
          {getSaveStatusIndicator()}
        </div>
      </div>
    </div>
  );
}
