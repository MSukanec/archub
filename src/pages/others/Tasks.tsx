import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomKanban } from '@/components/ui-custom/misc/CustomKanban';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban } from 'lucide-react';
import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard } from '@/hooks/use-kanban';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NewBoardModal } from '@/modals/tasks/NewBoardModal';
import { NewListModal } from '@/modals/tasks/NewListModal';

export default function Tasks() {
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const { currentBoardId, setCurrentBoardId } = useKanbanStore();
  
  const { data: userData } = useCurrentUser();
  const { data: boards = [], isLoading: boardsLoading } = useKanbanBoards();
  const { data: lists = [], isLoading: listsLoading } = useKanbanLists(currentBoardId || '');
  const { data: cards = [], isLoading: cardsLoading } = useKanbanCards(currentBoardId || '');
  
  const moveCardMutation = useMoveKanbanCard();

  // Auto-select first board if none selected
  useEffect(() => {
    if (!currentBoardId && boards.length > 0) {
      setCurrentBoardId(boards[0].id);
    }
  }, [boards, currentBoardId, setCurrentBoardId]);

  const handleCardMove = async (cardId: string, sourceListId: string, destListId: string, destIndex: number) => {
    if (!currentBoardId) return;

    try {
      await moveCardMutation.mutateAsync({
        cardId,
        newListId: destListId,
        newPosition: destIndex,
        boardId: currentBoardId
      });
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  const handleBoardChange = (boardId: string) => {
    setCurrentBoardId(boardId);
  };

  // Header configuration following ai-page-template.md
  const headerProps = {
    title: "Tareas",
    showSearch: false,
    actions: [
      boards.length > 0 && (
        <Select key="board-selector" value={currentBoardId || undefined} onValueChange={handleBoardChange}>
          <SelectTrigger className="w-[200px] h-8">
            <SelectValue placeholder="Seleccionar tablero..." />
          </SelectTrigger>
          <SelectContent>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      boards.length > 0 && (
        <Button 
          key="new-list"
          variant="outline" 
          className="h-8 px-3 text-sm"
          onClick={() => setShowNewListModal(true)}
          disabled={!currentBoardId}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nueva Lista
        </Button>
      ),
      <Button 
        key="new-board"
        className="h-8 px-3 text-sm"
        onClick={() => setShowNewBoardModal(true)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Nuevo Tablero
      </Button>
    ].filter(Boolean)
  };

  // Loading state
  if (boardsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Cargando tableros...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state with CustomEmptyState
  if (boards.length === 0) {
    return (
      <Layout headerProps={headerProps}>
        <CustomEmptyState
          icon={<Kanban className="w-8 h-8 text-muted-foreground" />}
          title="Aún no hay tareas!"
          description="Crea tu primer tablero para comenzar a organizar tareas"
          action={
            <Button onClick={() => setShowNewBoardModal(true)} className="h-8 px-3 text-sm">
              <Plus className="h-3 w-3 mr-1" />
              Crear Tablero
            </Button>
          }
        />
        
        <NewBoardModal
          open={showNewBoardModal}
          onClose={() => setShowNewBoardModal(false)}
        />
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout headerProps={headerProps}>
      {selectedBoard && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{selectedBoard.name}</h2>
          {selectedBoard.description && (
            <p className="text-sm text-muted-foreground">{selectedBoard.description}</p>
          )}
        </div>
      )}
      
      <CustomKanban 
        lists={lists}
        cards={cards}
        boardId={currentBoardId || ''}
        onCardMove={handleCardMove}
        onCreateList={() => setShowNewListModal(true)}
        loading={listsLoading || cardsLoading}
      />

      {/* Modals */}
      <NewBoardModal
        open={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
      />
      
      {currentBoardId && (
        <NewListModal
          boardId={currentBoardId}
          open={showNewListModal}
          onClose={() => setShowNewListModal(false)}
        />
      )}
    </Layout>
  );
}