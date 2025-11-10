import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { KanbanBox } from '@/components/ui-custom/KanbanBox';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Kanban, Edit, Trash2, List, Search, Filter, X } from 'lucide-react';
import { ActionBar } from '@/components/layout/desktop/ActionBar';

import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useUpdateKanbanBoard, useDeleteKanbanBoard, useDeleteKanbanList, useDeleteKanbanCard, useUpdateLastKanbanBoard } from '@/hooks/use-kanban';
import { useToast } from '@/hooks/use-toast';

import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useNavigationStore } from '@/stores/navigationStore';

import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import { ActionBarMobileProvider, useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { ActionBarMobile } from '@/components/layout/mobile/ActionBarMobile';

import { Card } from '@/components/ui/card';

function CalendarContent() {
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const { currentBoardId, setCurrentBoardId } = useKanbanStore();
  const { setActions, setShowActionBar } = useActionBarMobile();
  const { openModal } = useGlobalModalStore();
  
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  
  // Get boards for current organization (filtered by project if one is selected)
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
      search: {
        id: 'search',
        icon: <Search className="h-5 w-5" />,
        label: 'Buscar',
        onClick: () => {} // TODO: implement search
      },
      create: {
        id: 'create',
        icon: <Plus className="h-6 w-6" />,
        label: 'Nueva Lista',
        onClick: () => openModal('list', { boardId: currentBoardId }),
        variant: 'primary'
      },
      filter: {
        id: 'filter',
        icon: <Filter className="h-5 w-5" />,
        label: 'Filtros',
        onClick: () => {} // TODO: implement filters
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
    }
  };

  const handleBoardChange = (boardId: string) => {
    setCurrentBoardId(boardId);
    // Save the selected board preference
    updateLastBoardMutation.mutate(boardId);
  };

  // Current board for display
  const currentBoard = boards.find(board => board.id === currentBoardId);

  // Header configuration
  const headerProps = {
    icon: CheckSquare,
    title: "Tablero",
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
      title: "Tablero"
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
      title: "Tablero",
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
            <PlanRestricted 
              feature="max_kanban_boards" 
              current={boards.length}
            >
              <Button onClick={() => openModal('board', {})}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tablero
              </Button>
            </PlanRestricted>
          }
        />
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* ActionBar Desktop - Solo selector de tableros */}
      <ActionBar
        selectedValue={selectedBoard?.name || ''}
        onValueChange={(boardName: string) => {
          const board = boards.find(b => b.name === boardName);
          if (board) {
            handleBoardChange(board.id);
          }
        }}
        onEdit={() => {
          if (selectedBoard) {
            handleEditBoard(selectedBoard)
          }
        }}
        onDelete={() => {
          if (currentBoardId) {
            handleDeleteBoard(currentBoardId)
          }
        }}
        placeholder="Selecciona un tablero"
        options={boards.map(board => ({ value: board.name, label: board.name }))}
        disabled={boards.length === 0}
      />
      
      {selectedBoard && (
        <KanbanBox 
          lists={lists}
          cards={cards}
          boardId={currentBoardId || ''}
          onCardMove={handleCardMove}
          onCreateList={() => openModal('list', { boardId: currentBoardId })}
          onDeleteList={handleDeleteList}
          onDeleteCard={handleDeleteCard}
          onCardEdit={(card) => openModal('card', { card: card, isEditing: true, boardId: currentBoardId })}
          loading={listsLoading || cardsLoading}
        />
      )}
      </div>
    </Layout>
  );
}

export default function Calendar() {
  return (
    <ActionBarMobileProvider>
      <CalendarContent />
      <ActionBarMobile />
    </ActionBarMobileProvider>
  );
}