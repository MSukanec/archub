import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookOpen, FileText, Calendar, Bookmark, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CourseLessonNote } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface CourseNotesProps {
  courseId: string;
}

interface NoteWithLesson extends CourseLessonNote {
  lesson?: {
    title: string;
    module_id: string;
  };
  module?: {
    title: string;
    sort_index: number;
  };
}

export default function CourseNotes({ courseId }: CourseNotesProps) {
  // Fetch all notes for the course with lesson and module information
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['course-notes', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get the user record from the users table
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .ilike('email', authUser.email)
        .single();

      if (!userRecord) return [];

      // First, get all modules for this course
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id, title, sort_index')
        .eq('course_id', courseId);

      if (!modules || modules.length === 0) return [];

      const moduleIds = modules.map(m => m.id);

      // Then get all lessons for these modules
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title, module_id, sort_index')
        .in('module_id', moduleIds);

      if (!lessons || lessons.length === 0) return [];

      const lessonIds = lessons.map(l => l.id);

      // Get all notes for these lessons
      const { data: notesData, error } = await supabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', userRecord.id)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }

      // Enrich notes with lesson and module data
      const enrichedNotes: NoteWithLesson[] = (notesData || []).map(note => {
        const lesson = lessons.find(l => l.id === note.lesson_id);
        const module = lesson ? modules.find(m => m.id === lesson.module_id) : undefined;
        
        return {
          ...note,
          lesson: lesson ? { title: lesson.title, module_id: lesson.module_id } : undefined,
          module: module ? { title: module.title, sort_index: module.sort_index } : undefined
        };
      });

      // Sort by module sort_index, then by created_at
      enrichedNotes.sort((a, b) => {
        if (a.module && b.module && a.module.sort_index !== b.module.sort_index) {
          return a.module.sort_index - b.module.sort_index;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return enrichedNotes;
    },
    enabled: !!courseId && !!supabase
  });

  // Separate notes by type
  const summaryNotes = notes.filter(note => note.note_type === 'summary');
  const markerNotes = notes.filter(note => note.note_type === 'marker');

  // Group summary notes by lesson
  const summariesByLesson = summaryNotes.reduce((acc, note) => {
    const lessonTitle = note.lesson?.title || 'Sin lección';
    if (!acc[lessonTitle]) {
      acc[lessonTitle] = {
        moduleTitle: note.module?.title || '',
        notes: []
      };
    }
    acc[lessonTitle].notes.push(note);
    return acc;
  }, {} as Record<string, { moduleTitle: string; notes: NoteWithLesson[] }>);

  // Group marker notes by lesson
  const markersByLesson = markerNotes.reduce((acc, note) => {
    const lessonTitle = note.lesson?.title || 'Sin lección';
    if (!acc[lessonTitle]) {
      acc[lessonTitle] = {
        moduleTitle: note.module?.title || '',
        markers: []
      };
    }
    acc[lessonTitle].markers.push(note);
    return acc;
  }, {} as Record<string, { moduleTitle: string; markers: NoteWithLesson[] }>);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No hay apuntes aún</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Comienza a tomar notas en las lecciones del curso y aparecerán aquí organizadas por lección
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="course-notes-container">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Mis Apuntes del Curso</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {summaryNotes.length} {summaryNotes.length === 1 ? 'resumen' : 'resúmenes'} y {markerNotes.length} {markerNotes.length === 1 ? 'marcador' : 'marcadores'}
          </p>
        </div>
      </div>

      {/* Summary Notes Section */}
      {summaryNotes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Resúmenes</h3>
          </div>

          {Object.entries(summariesByLesson).map(([lessonTitle, { moduleTitle, notes: lessonNotes }]) => (
            <div key={lessonTitle} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-lg">{lessonTitle}</h4>
                    {moduleTitle && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Módulo: {moduleTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {lessonNotes.map((note) => (
                  <div key={note.id} className="px-6 py-4" data-testid={`summary-${note.id}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(note.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                      {note.updated_at !== note.created_at && (
                        <span className="text-muted-foreground/70">
                          (editado)
                        </span>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {note.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Markers Section */}
      {markerNotes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Marcadores</h3>
          </div>

          {Object.entries(markersByLesson).map(([lessonTitle, { moduleTitle, markers }]) => (
            <div key={lessonTitle} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-lg">{lessonTitle}</h4>
                    {moduleTitle && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Módulo: {moduleTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {markers.map((marker) => (
                  <div key={marker.id} className="px-6 py-4 flex items-start gap-4" data-testid={`marker-${marker.id}`}>
                    <div className="flex items-center gap-2 min-w-[80px] pt-0.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono font-medium">
                        {formatTime(marker.time_sec)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {marker.is_pinned && (
                        <Badge variant="secondary" className="mb-2">
                          Fijado
                        </Badge>
                      )}
                      {marker.body ? (
                        <p className="text-foreground leading-relaxed">
                          {marker.body}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">
                          Sin descripción
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(marker.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
