import { useCallback } from 'react';
import { Layout, Plus } from 'lucide-react';
import { useBoards } from '@/features/moodboard';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { useProjectContext } from '@/stores/projectContext';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

interface MoodboardBoardsProps {
  onSelectBoard: (boardId: string | null) => void;
}

export function MoodboardBoards({ onSelectBoard }: MoodboardBoardsProps) {
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { data: boards = [], isLoading } = useBoards(selectedProjectId);

  const handleCreateBoard = useCallback(() => {
    openModal('new-moodboard-item', {
      projectId: selectedProjectId,
    });
  }, [selectedProjectId, openModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tableros...</p>
        </div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        icon={<Layout />}
        title="Sin tableros"
        description="Crea tu primer tablero para organizar inspiración"
        action={
          <Button onClick={handleCreateBoard} className="gap-2">
            <Plus className="w-4 h-4" />
            Crear Tablero
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onSelectBoard(board.id)}
            className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-all duration-200 text-left"
            data-testid={`board-card-${board.id}`}
          >
            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-4 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
              <Layout className="w-8 h-8 text-muted-foreground mb-2 relative z-10" />
              <div className="relative z-10 text-center">
                <h3 className="font-semibold truncate">{board.name}</h3>
                {board.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {board.description}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {board._count?.pins || 0} pins
              </p>
            </div>
          </button>
        ))}

        {/* Add Board Card */}
        <button
          onClick={handleCreateBoard}
          className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-transparent hover:bg-muted/30 transition-all duration-200 aspect-square flex flex-col items-center justify-center gap-2"
          data-testid="button-add-board"
        >
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Nuevo Tablero
          </span>
        </button>
      </div>
    </div>
  );
}
