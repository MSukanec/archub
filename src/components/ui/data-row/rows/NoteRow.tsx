import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataRowCard from '../DataRowCard';

interface NoteRowProps {
  note: {
    id: string;
    lesson_title: string;
    module_title: string;
    body: string;
  };
  onGoToNote: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteRow({ note, onGoToNote, onDelete }: NoteRowProps) {
  return (
    <DataRowCard
      data-testid={`note-row-${note.id}`}
    >
      {/* Layout vertical completo */}
      <div className="w-full space-y-3">
        {/* 1. Nombre de Lección */}
        <p className="font-medium text-sm leading-tight">
          {note.lesson_title}
        </p>

        {/* 2. Nombre de Módulo */}
        <p className="text-xs text-muted-foreground">
          {note.module_title}
        </p>

        {/* 3. Texto del apunte */}
        {note.body && (
          <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {note.body}
          </p>
        )}

        {/* 4. Botones: IR + ELIMINAR */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          {/* Botón IR (2/3) */}
          <Button
            variant="default"
            size="sm"
            className="col-span-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGoToNote(note.id);
            }}
            data-testid={`button-go-to-note-${note.id}`}
          >
            Ir
          </Button>

          {/* Botón ELIMINAR (1/3) */}
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(note.id);
            }}
            data-testid={`button-delete-note-${note.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DataRowCard>
  );
}
