import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { KanbanBox } from '@/components/ui-custom/KanbanBox';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban, Edit, Trash2, List, Search, Filter, X } from 'lucide-react';

import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useUpdateKanbanBoard, useDeleteKanbanBoard, useDeleteKanbanList, useDeleteKanbanCard, useUpdateLastKanbanBoard } from '@/hooks/use-kanban';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

import { CustomRestricted } from '@/components/ui-custom/CustomRestricted';
import { MobileActionBarProvider, useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { MobileActionBar } from '@/components/layout/mobile/MobileActionBar';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Card } from '@/components/ui/card';

function TasksContent() {


  const { currentBoardId, setCurrentBoardId } = useKanbanStore();
  const { setActions, setShowActionBar } = useMobileActionBar();
  const { openModal } = useGlobalModalStore();
  
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
  const deleteCardMutation = useDeleteKanbanCard();
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
        onClick: () => openModal('list', { boardId: currentBoardId }),
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
    openModal('board', { board: board, isEditing: true });
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

  const handleDeleteList = async (listId: string) => {
    await deleteListMutation.mutateAsync(listId);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!currentBoardId) return;
    await deleteCardMutation.mutateAsync({ cardId, boardId: currentBoardId });
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
          onClick={() => openModal('board', {})}
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
            onClick={() => openModal("board", {})}
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

  // Empty state with EmptyState
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
            onClick={() => openModal("board", {})}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nuevo Tablero
          </Button>
        </CustomRestricted>
      ]
    };

    return (
      <Layout headerProps={emptyHeaderProps} wide={true}>
        <EmptyState
          icon={<Kanban className="w-8 h-8 text-muted-foreground" />}
          title="Aún no hay tareas!"
          description="Crea tu primer tablero para comenzar a organizar tareas"
          action={
            <Button onClick={() => openModal("board", {})} className="h-8 px-3 text-sm">
              <Plus className="h-3 w-3 mr-1" />
              Crear Tablero
            </Button>
          }
        />
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6 overflow-x-hidden">
        {/* FeatureIntroduction */}
        <FeatureIntroduction
          title="Tareas"
          icon={<CheckSquare className="w-5 h-5" />}
          features={[
            {
              icon: <Kanban className="w-5 h-5" />,
              title: "Tableros Kanban organizados",
              description: "Gestiona tus tareas con un sistema visual tipo Kanban donde puedes organizar las tareas en listas personalizables como 'Por hacer', 'En progreso' y 'Completadas', facilitando el seguimiento del flujo de trabajo."
            },
            {
              icon: <List className="w-5 h-5" />,
              title: "Listas flexibles y personalizables",
              description: "Crea tantas listas como necesites dentro de cada tablero, asigna responsables, establece fechas límite y mueve las tareas fácilmente entre diferentes estados según avance el proyecto."
            },
            {
              icon: <CheckSquare className="w-5 h-5" />,
              title: "Seguimiento de completitud",
              description: "Marca tareas como completadas con un sistema de checkbox visual, mantén un historial de tareas terminadas y visualiza el progreso general del equipo en tiempo real."
            },
            {
              icon: <Plus className="w-5 h-5" />,
              title: "Colaboración en equipo",
              description: "Asigna tareas a miembros específicos del equipo, agrega descripciones detalladas, comenta en las tareas y mantén a todos informados sobre el progreso del proyecto."
            }
          ]}
        />

        {/* Board Selector Card */}
        {boards.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Tablero:</span>
              <Select value={currentBoardId || undefined} onValueChange={handleBoardChange}>
                <SelectTrigger className="flex-1 h-8">
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
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleEditBoard(selectedBoard)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
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
          </Card>
        )}
      
        {selectedBoard && (
          <KanbanBox 
            lists={lists}
            cards={cards}
            boardId={currentBoardId || ''}
            onCardMove={handleCardMove}
            onCreateList={() => openModal('list', { boardId: currentBoardId })}
            onDeleteList={handleDeleteList}
            onDeleteCard={handleDeleteCard}
            onCardEdit={(card) => openModal('card', { card: card, isEditing: true })}
            loading={listsLoading || cardsLoading}
          />
        )}
      </div>


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