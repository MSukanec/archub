import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NoteRow } from '@/components/ui/data-row/rows';

interface CourseNotesTabProps {
  courseId: string;
  courseSlug?: string;
}

interface NoteWithLesson {
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

export default function CourseNotesTab({ courseId, courseSlug }: CourseNotesTabProps) {
  const [, navigate] = useLocation();
  const { setCurrentLesson } = useCourseSidebarStore();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();

  // Fetch all notes for the course with lesson and module information (OPTIMIZED)
  const { data: notes = [], isLoading } = useQuery<NoteWithLesson[]>({
    queryKey: [`/api/courses/${courseId}/notes`],
    enabled: !!courseId
  });

  // Get unique modules from notes
  const modules = useMemo(() => {
    const uniqueModules = new Map<string, { title: string; sort_index: number }>();
    
    notes.forEach(note => {
      if (note.module) {
        const moduleKey = note.module.title;
        if (!uniqueModules.has(moduleKey)) {
          uniqueModules.set(moduleKey, note.module);
        }
      }
    });

    return Array.from(uniqueModules.values()).sort((a, b) => a.sort_index - b.sort_index);
  }, [notes]);

  // Filter notes by selected module
  const filteredNotes = useMemo(() => {
    if (selectedModule === 'all') return notes;
    return notes.filter(note => note.module?.title === selectedModule);
  }, [notes, selectedModule]);

  // Add moduleTitle property to notes for grouping
  const notesWithModuleTitle = useMemo(() => {
    return filteredNotes.map(note => ({
      ...note,
      moduleTitle: note.module?.title || 'Sin módulo',
      moduleSortIndex: note.module?.sort_index || 999
    }));
  }, [filteredNotes]);

  // Delete note mutation (OPTIMIZED)
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/notes`] });
      toast({
        title: "Apunte eliminado",
        description: "El apunte se eliminó correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el apunte",
        variant: "destructive",
      });
    }
  });

  const handleDeleteNote = (note: NoteWithLesson) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar Apunte',
      description: '¿Estás seguro de que querés eliminar este apunte?',
      itemName: note.body?.substring(0, 50) + '...' || 'Apunte sin contenido',
      onConfirm: () => deleteNoteMutation.mutate(note.id)
    });
  };

  const handleGoToLesson = (lessonId: string) => {
    // Set the current lesson in the sidebar
    setCurrentLesson(lessonId);
    
    // Update URL with deep link params (for browser navigation and refresh support)
    if (courseSlug) {
      const params = new URLSearchParams();
      params.set('tab', 'Lecciones');
      params.set('lesson', lessonId);
      navigate(`/learning/courses/${courseSlug}?${params.toString()}`);
    }
    
    // Use the store to navigate (this will switch to "Lecciones" tab)
    goToLesson(lessonId, null);
  };

  // Render module group header
  const renderModuleGroupHeader = (moduleName: string, groupNotes: any[]) => {
    const notesCount = groupNotes.length;
    return (
      <div 
        className="px-4 py-2 text-xs font-medium font-bold"
        style={{ 
          backgroundColor: "var(--table-group-header-bg)",
          color: "white"
        }}
      >
        {moduleName} ({notesCount} {notesCount === 1 ? 'apunte' : 'apuntes'})
      </div>
    );
  };

  const columns = [
    {
      key: 'lesson',
      label: 'Lección',
      sortable: true,
      sortType: 'string' as const,
      render: (note: NoteWithLesson) => (
        <div className="font-medium">
          {note.lesson?.title || 'Sin lección'}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha',
      sortable: true,
      sortType: 'string' as const,
      render: (note: NoteWithLesson) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(note.created_at), "d MMM yyyy", { locale: es })}
          </span>
        </div>
      )
    },
    {
      key: 'body',
      label: 'Contenido',
      sortable: false,
      render: (note: NoteWithLesson) => (
        <div className="flex items-start gap-2">
          {note.is_pinned && (
            <Badge variant="secondary" className="shrink-0">
              Fijado
            </Badge>
          )}
          <span className={note.body ? 'line-clamp-2' : 'text-muted-foreground italic'}>
            {note.body || 'Sin contenido'}
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

  if (filteredNotes.length === 0) {
    return (
      <EmptyState
        icon={<FileText />}
        title="No hay apuntes"
        description="Los apuntes que crees en las lecciones aparecerán aquí"
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
    <div className="space-y-6" data-testid="course-notes-tab">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <Table
          data={notesWithModuleTitle}
          columns={columns}
          groupBy="moduleTitle"
          rowActions={(note) => [
            {
              icon: ArrowRight,
              label: 'Ir a lección',
              onClick: () => handleGoToLesson(note.lesson_id)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteNote(note),
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
              icon={<FileText />}
              title="No hay apuntes"
              description="Los apuntes que crees en las lecciones aparecerán aquí"
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
            notesWithModuleTitle.reduce((acc, note) => {
              const moduleTitle = note.moduleTitle;
              if (!acc[moduleTitle]) {
                acc[moduleTitle] = [];
              }
              acc[moduleTitle].push(note);
              return acc;
            }, {} as Record<string, typeof notesWithModuleTitle>)
          )
          .sort((a, b) => {
            const moduleA = a[1][0]?.moduleSortIndex || 999;
            const moduleB = b[1][0]?.moduleSortIndex || 999;
            return moduleA - moduleB;
          })
          .map(([moduleTitle, moduleNotes]) => (
            <div key={moduleTitle}>
              {/* Module Header for Mobile */}
              <div className="px-4 py-2 mb-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: "var(--table-group-header-bg)", color: "white" }}>
                {moduleTitle} ({moduleNotes.length})
              </div>
              {/* Module Cards */}
              <div className="space-y-0">
                {moduleNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={{
                      id: note.id,
                      lesson_title: note.lesson?.title || 'Sin lección',
                      module_title: note.module?.title || 'Sin módulo',
                      body: note.body
                    }}
                    onGoToNote={() => handleGoToLesson(note.lesson_id)}
                    onDelete={() => handleDeleteNote(note)}
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
