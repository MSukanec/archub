import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomKanban } from '@/components/ui-custom/misc/CustomKanban';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus } from 'lucide-react';
import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard } from '@/hooks/use-kanban';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
// import { NewBoardModal } from '@/modals/tasks/NewBoardModal';
// import { NewListModal } from '@/modals/tasks/NewListModal';

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

  if (boardsLoading) {
    return (
      <Layout headerProps={{ title: "Gestión de Tareas", showSearch: false, actions: [] }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Cargando tableros...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (boards.length === 0) {
    return (
      <Layout headerProps={{ title: "Gestión de Tareas", showSearch: false, actions: [] }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold">No hay tableros Kanban</div>
            <div className="text-sm text-muted-foreground">
              Crea tu primer tablero para comenzar a organizar tareas
            </div>
            <Button onClick={() => setShowNewBoardModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tablero
            </Button>
          </div>
        </div>
        
        {/* <NewBoardModal
          open={showNewBoardModal}
          onClose={() => setShowNewBoardModal(false)}
        /> */}
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout 
      headerProps={{
        title: "Gestión de Tareas",
        showSearch: false,
        actions: [
          <div key="board-selector" className="flex items-center gap-2">
            <Select value={currentBoardId || undefined} onValueChange={handleBoardChange}>
              <SelectTrigger className="w-[200px]">
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
          </div>,
          <Button 
            key="new-list"
            variant="outline" 
            size="sm"
            onClick={() => setShowNewListModal(true)}
            disabled={!currentBoardId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Lista
          </Button>,
          <Button 
            key="new-board"
            size="sm"
            onClick={() => setShowNewBoardModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tablero
          </Button>
        ]
      }}
    >
      <div className="h-full">
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
          loading={listsLoading || cardsLoading}
        />
      </div>

      {/* Modals - Temporarily disabled while fixing imports */}
      {/* <NewBoardModal
        open={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
      />
      
      {currentBoardId && (
        <NewListModal
          boardId={currentBoardId}
          open={showNewListModal}
          onClose={() => setShowNewListModal(false)}
        />
      )} */}
    </Layout>
  );
}