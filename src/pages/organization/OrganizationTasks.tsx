import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomKanban } from '@/components/ui-custom/misc/CustomKanban';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban, Edit, Trash2, List, Search, Filter, X } from 'lucide-react';
import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useUpdateKanbanBoard, useDeleteKanbanBoard, useDeleteKanbanList, useUpdateLastKanbanBoard } from '@/hooks/use-kanban';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NewBoardModal } from '@/modals/tasks/NewBoardModal';
import { NewListModal } from '@/modals/tasks/NewListModal';
import { CustomRestricted } from '@/components/ui-custom/misc/CustomRestricted';
import { MobileActionBarProvider, useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { MobileActionBar } from '@/components/ui-custom/mobile/MobileActionBar';

function TasksContent() {
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const { currentBoardId, setCurrentBoardId } = useKanbanStore();
  const { setActions, setShowActionBar } = useMobileActionBar();
  
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  
  // Get boards for current organization (no project filtering)
  const { data: boards = [], isLoading: boardsLoading } = useKanbanBoards();
  const { data: lists = [], isLoading: listsLoading } = useKanbanLists(currentBoardId || '');
  const { data: cards = [], isLoading: cardsLoading } = useKanbanCards(currentBoardId || '');
  
  const moveCardMutation = useMoveKanbanCard();
  const updateBoardMutation = useUpdateKanbanBoard();
  const deleteBoardMutation = useDeleteKanbanBoard();
  const deleteListMutation = useDeleteKanbanList();
  const updateLastBoardMutation = useUpdateLastKanbanBoard();

  // Initialize board selection based on saved preference or first available board
  useEffect(() => {
    if (boards.length > 0 && !currentBoardId) {
      const savedBoardId = userData?.preferences?.last_kanban_board_id;
      const boardExists = savedBoardId && boards.some(board => board.id === savedBoardId);
      
      // Set to saved board if it exists, otherwise first board
      const selectedBoardId = boardExists ? savedBoardId : boards[0].id;
      setCurrentBoardId(selectedBoardId);
    }
  }, [boards, currentBoardId, setCurrentBoardId, userData?.preferences?.last_kanban_board_id]);

  // Reset board selection when organization changes
  useEffect(() => {
    setCurrentBoardId(null);
  }, [userData?.organization?.id, setCurrentBoardId]);

  // Configure mobile action bar
  useEffect(() => {
    setActions({
      slot2: {
        id: 'search',
        icon: <Search className="h-5 w-5" />,
        label: 'Buscar',
        onClick: () => {} // TODO: implement search
      },
      slot3: {
        id: 'create',
        icon: <Plus className="h-6 w-6" />,
        label: 'Nueva Lista',
        onClick: () => setShowNewListModal(true),
        variant: 'primary'
      },
      slot4: {
        id: 'filter',
        icon: <Filter className="h-5 w-5" />,
        label: 'Filtros',
        onClick: () => {} // TODO: implement filters
      },
      slot5: {
        id: 'clear',
        icon: <X className="h-5 w-5" />,
        label: 'Limpiar',
        onClick: () => {} // TODO: implement clear filters
      }
    });
    setShowActionBar(true);
  }, [setActions, setShowActionBar]);

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
    // Save the selected board preference
    updateLastBoardMutation.mutate(boardId);
  };

  const handleDeleteList = (listId: string, boardId?: string) => {
    deleteListMutation.mutate(listId);
  };

  // Current board for display
  const currentBoard = boards.find(board => board.id === currentBoardId);

  // Header configuration following ai-page-template.md
  const headerProps = {
    title: "Tareas",
    showSearch: false,
    actions: [
      <CustomRestricted 
        key="new-board"
        feature="max_kanban_boards"
        current={boards.length}
      >
        <Button 
          className="h-8 px-3 text-sm"
          onClick={() => setShowNewBoardModal(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nuevo Tablero
        </Button>
      </CustomRestricted>
    ]
  };

  // Loading state
  if (boardsLoading) {
    const loadingHeaderProps = {
      title: "Tareas",
      showSearch: false,
      actions: [
        <CustomRestricted 
          key="new-board"
          feature="max_kanban_boards"
          current={0}
        >
          <Button 
            className="h-8 px-3 text-sm"
            onClick={() => setShowNewBoardModal(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nuevo Tablero
          </Button>
        </CustomRestricted>
      ]
    };

    return (
      <Layout headerProps={loadingHeaderProps} wide={true}>
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
        <CustomRestricted 
          key="new-board"
          feature="max_kanban_boards"
          current={0}
        >
          <Button 
            className="h-8 px-3 text-sm"
            onClick={() => setShowNewBoardModal(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nuevo Tablero
          </Button>
        </CustomRestricted>
      ]
    };

    return (
      <Layout headerProps={emptyHeaderProps} wide={true}>
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
    <Layout headerProps={headerProps} wide={true}>
      {/* Board Title with Selector and Actions */}
      {boards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Select value={currentBoardId || undefined} onValueChange={handleBoardChange}>
              <SelectTrigger className="w-[300px] h-10 border border-input bg-background px-3 py-2 text-sm ring-offset-background">
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

export default function Tasks() {
  return (
    <MobileActionBarProvider>
      <TasksContent />
      <MobileActionBar />
    </MobileActionBarProvider>
  );
}