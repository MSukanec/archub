import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { KanbanBox } from '@/components/ui-custom/KanbanBox';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban, Edit, Trash2, List, Search, Filter, X } from 'lucide-react';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';

import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useUpdateKanbanBoard, useDeleteKanbanBoard, useDeleteKanbanList, useDeleteKanbanCard, useUpdateLastKanbanBoard } from '@/hooks/use-kanban';
import { useToast } from '@/hooks/use-toast';

import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

import { CustomRestricted } from '@/components/ui-custom/CustomRestricted';
import { MobileActionBarProvider, useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { MobileActionBar } from '@/components/layout/mobile/MobileActionBar';

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
    const boardToDelete = boards.find(b => b.id === boardId);
    
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar tablero',
      description: 'Esta acción eliminará permanentemente el tablero y todas las listas y tarjetas que contiene. Esta acción no se puede deshacer.',
      itemName: boardToDelete?.name || 'tablero',
      destructiveActionText: 'Eliminar tablero',
      onConfirm: () => {
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
      },
      isLoading: deleteBoardMutation.isPending
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
    icon: CheckSquare,
    title: "Tareas para Hacer",
    actionButton: currentBoardId ? {
      label: 'Nueva Lista',
      icon: Plus,
      onClick: () => openModal('list', { boardId: currentBoardId })
    } : undefined,
    additionalButton: {
      label: 'Nuevo Tablero',
      icon: Plus,
      variant: 'ghost' as const,
      onClick: () => openModal('board', {}),
      restricted: {
        feature: "max_kanban_boards",
        current: boards.length
      }
    }
  };

  // Loading state
  if (boardsLoading) {
    const loadingHeaderProps = {
      icon: CheckSquare,
      title: "Tareas para Hacer"
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
      icon: CheckSquare,
      title: "Tareas para Hacer",
      actionButton: {
        label: 'Nuevo Tablero',
        icon: Plus,
        onClick: () => openModal('board', {}),
        restricted: {
          feature: "max_kanban_boards",
          current: boards.length
        }
      }
    };

    return (
      <Layout headerProps={emptyHeaderProps} wide={true}>
        <EmptyState
          icon={<Kanban className="w-8 h-8 text-muted-foreground" />}
          title="No hay tableros creados"
          description="Crea tu primer tablero para comenzar a organizar tareas con el sistema Kanban"
          action={
            <CustomRestricted 
              feature="max_kanban_boards" 
              current={boards.length}
            >
              <Button onClick={() => openModal('board', {})}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tablero
              </Button>
            </CustomRestricted>
          }
        />
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout headerProps={headerProps} wide={true}>


      {/* ActionBar Desktop - Solo selector de tableros */}
      <ActionBarDesktop
        title="Tableros de Tareas"
        icon={<Kanban className="w-5 h-5" />}
        budgetSelector={{
          budgets: boards,
          selectedBudgetId: currentBoardId || '',
          onBudgetChange: handleBoardChange,
          onEditBudget: () => {
            if (selectedBoard) {
              handleEditBoard(selectedBoard)
            }
          },
          onDeleteBudget: () => {
            if (currentBoardId) {
              handleDeleteBoard(currentBoardId)
            }
          }
        }}
      />
      
      {selectedBoard ? (
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
      ) : (
        <EmptyState
          icon={<Kanban className="w-8 h-8 text-muted-foreground" />}
          title="Selecciona un tablero"
          description="Elige un tablero del selector para comenzar a gestionar tus tareas"
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