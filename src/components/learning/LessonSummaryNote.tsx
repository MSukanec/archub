import { useState, useRef, useEffect } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { CourseLessonNote } from '@shared/schema';

interface LessonSummaryNoteProps {
  lessonId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function LessonSummaryNote({ lessonId }: LessonSummaryNoteProps) {
  const [noteText, setNoteText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Fetch summary note with React Query (optimized backend endpoint)
  const { data: note, isLoading } = useQuery<CourseLessonNote | null>({
    queryKey: [`/api/lessons/${lessonId}/summary-note`],
    enabled: !!lessonId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Update mutation
  const saveMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiRequest('PUT', `/api/lessons/${lessonId}/summary-note`, { body });
    },
    onMutate: () => {
      setSaveStatus('saving');
    },
    onSuccess: () => {
      setSaveStatus('saved');
      
      // Invalidar la query específica de esta nota
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/summary-note`] });
      
      // Invalidar TODAS las queries relacionadas con notas para que el tab de apuntes se actualice
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          // Convertir key a string para buscar patrones
          const keyString = key.join('/');
          
          // Invalidar cualquier query que tenga "notes" en su path
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

  // Initialize noteText when data loads
  useEffect(() => {
    if (note) {
      setNoteText(note.body || '');
    } else {
      setNoteText('');
    }
    // Mark initial load as done after a delay
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [note]);

  // Auto-save with debounce
  useEffect(() => {
    // Don't auto-save during initial load
    if (isInitialLoadRef.current) {
      return;
    }

    // Don't save if note is empty and was empty initially
    if (noteText.trim() === '' && (!note || note.body === '')) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce save
    debounceTimerRef.current = setTimeout(() => {
      saveMutation.mutate(noteText);
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
      <div className="space-y-3 animate-pulse">
        <div className="h-[150px] bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="lesson-summary-note-container">
      <Textarea
        data-testid="summary-note-textarea"
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Escribe un resumen de esta lección..."
        className="min-h-[150px] resize-none rounded-lg border-border focus:border-primary transition-colors"
      />
      
      <div className="flex justify-end">
        {getSaveStatusIndicator()}
      </div>
    </div>
  );
}
