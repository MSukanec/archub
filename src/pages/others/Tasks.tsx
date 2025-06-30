import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomKanban } from '@/components/ui-custom/misc/CustomKanban';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban, Edit, Trash2 } from 'lucide-react';
import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useUpdateKanbanBoard, useDeleteKanbanBoard, useDeleteKanbanList } from '@/hooks/use-kanban';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NewBoardModal } from '@/modals/tasks/NewBoardModal';
import { NewListModal } from '@/modals/tasks/NewListModal';

export default function Tasks() {
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const { currentBoardId, setCurrentBoardId } = useKanbanStore();
  
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  
  // Get project data from user preferences
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: boards = [], isLoading: boardsLoading } = useKanbanBoards(projectId);
  const { data: lists = [], isLoading: listsLoading } = useKanbanLists(currentBoardId || '');
  const { data: cards = [], isLoading: cardsLoading } = useKanbanCards(currentBoardId || '');
  
  const moveCardMutation = useMoveKanbanCard();
  const updateBoardMutation = useUpdateKanbanBoard();
  const deleteBoardMutation = useDeleteKanbanBoard();
  const deleteListMutation = useDeleteKanbanList();

  // Auto-select first board if none selected
  useEffect(() => {
    if (!currentBoardId && boards.length > 0) {
      setCurrentBoardId(boards[0].id);
    }
  }, [boards, currentBoardId, setCurrentBoardId]);

  const handleEditBoard = (board: any) => {
    setEditingBoard(board);
    setShowEditBoardModal(true);
  };

  const handleDeleteBoard = (boardId: string) => {
    deleteBoardMutation.mutate(boardId, {
      onSuccess: () => {
        if (currentBoardId === boardId) {
          const remainingBoards = boards.filter(b => b.id !== boardId);
          if (remainingBoards.length > 0) {
            setCurrentBoardId(remainingBoards[0].id);
          } else {
            setCurrentBoardId(null);
          }
        }
      }
    });
  };

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

  const handleDeleteList = (listId: string, boardId: string) => {
    deleteListMutation.mutate({ listId, boardId });
  };

  // Current board for display
  const currentBoard = boards.find(board => board.id === currentBoardId);

  // Header configuration following ai-page-template.md
  const headerProps = {
    title: "Tareas",
    showSearch: false,
    actions: [
      <Button 
        key="new-board"
        className="h-8 px-3 text-sm"
        onClick={() => setShowNewBoardModal(true)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Nuevo Tablero
      </Button>
    ]
  };

  // Loading state
  if (boardsLoading) {
    const loadingHeaderProps = {
      title: "Tareas",
      showSearch: false,
      actions: [
        <Button 
          key="new-board"
          className="h-8 px-3 text-sm"
          onClick={() => setShowNewBoardModal(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nuevo Tablero
        </Button>
      ]
    };

    return (
      <Layout headerProps={loadingHeaderProps}>
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
    const emptyHeaderProps = {
      title: "Tareas",
      showSearch: false,
      actions: [
        <Button 
          key="new-board"
          className="h-8 px-3 text-sm"
          onClick={() => setShowNewBoardModal(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nuevo Tablero
        </Button>
      ]
    };

    return (
      <Layout headerProps={emptyHeaderProps}>
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
      {/* Board Title with Selector and Actions */}
      {boards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Select value={currentBoardId || undefined} onValueChange={handleBoardChange}>
              <SelectTrigger className="w-[300px] h-12 text-xl font-semibold border-0 bg-transparent p-0 focus:ring-0">
                <SelectValue placeholder="Seleccionar tablero...">
                  {selectedBoard?.name || "Seleccionar tablero..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedBoard && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditBoard(selectedBoard)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tablero?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente el tablero "{selectedBoard.name}" y todas sus listas y tarjetas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDeleteBoard(selectedBoard.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
          
          {selectedBoard?.description && (
            <p className="text-sm text-muted-foreground mt-2">{selectedBoard.description}</p>
          )}
        </div>
      )}
      
      {selectedBoard && (
        <CustomKanban 
          lists={lists}
          cards={cards}
          boardId={currentBoardId || ''}
          onCardMove={handleCardMove}
          onCreateList={() => setShowNewListModal(true)}
          onDeleteList={handleDeleteList}
          loading={listsLoading || cardsLoading}
        />
      )}

      {/* Modals */}
      <NewBoardModal
        open={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
      />
      
      <NewBoardModal
        open={showEditBoardModal}
        onClose={() => setShowEditBoardModal(false)}
        board={editingBoard}
        isEditing={true}
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