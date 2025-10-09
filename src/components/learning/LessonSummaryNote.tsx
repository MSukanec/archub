import { useState, useEffect, useRef } from 'react';
import { FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface LessonSummaryNoteProps {
  lessonId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function LessonSummaryNote({ lessonId }: LessonSummaryNoteProps) {
  const [noteText, setNoteText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const initialNoteTextRef = useRef('');

  useEffect(() => {
    const loadNote = async () => {
      try {
        setIsLoading(true);
        isInitialLoadRef.current = true;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.email) return;

        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .ilike('email', authUser.email)
          .single();

        if (!userRecord) return;

        const { data: note } = await supabase
          .from('course_lesson_notes')
          .select('*')
          .eq('user_id', userRecord.id)
          .eq('lesson_id', lessonId)
          .eq('note_type', 'summary')
          .maybeSingle();
        
        if (note) {
          setNoteText(note.body);
          initialNoteTextRef.current = note.body;
        } else {
          setNoteText('');
          initialNoteTextRef.current = '';
        }
      } catch (error) {
        console.error('Error loading summary note:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadNote();
  }, [lessonId]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    if (noteText.trim() === '' && initialNoteTextRef.current === '') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('saving');

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setSaveStatus('error');
          return;
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.email) {
          setSaveStatus('error');
          return;
        }

        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .ilike('email', authUser.email)
          .single();

        if (!userRecord) {
          setSaveStatus('error');
          return;
        }

        // Upsert the summary note
        const { error } = await supabase
          .from('course_lesson_notes')
          .upsert({
            user_id: userRecord.id,
            lesson_id: lessonId,
            note_type: 'summary',
            body: noteText,
            time_sec: null,
            is_pinned: false
          }, {
            onConflict: 'user_id,lesson_id,note_type',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Failed to save summary note:', error);
          setSaveStatus('error');
          return;
        }

        initialNoteTextRef.current = noteText;
        setSaveStatus('saved');

        if (savedTimerRef.current) {
          clearTimeout(savedTimerRef.current);
        }

        savedTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 800);

      } catch (error) {
        console.error('Error saving summary note:', error);
        setSaveStatus('error');
      }
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
    <div className="bg-card border border-border rounded-lg p-6" data-testid="lesson-summary-note-container">
      <div className="flex items-center gap-3 mb-3">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Mis Apuntes</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Resumen general de la lección - se guarda automáticamente
      </p>

      <div className="space-y-3">
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
    </div>
  );
}
