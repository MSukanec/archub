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
        label: 'Buscar',
        onClick: () => {} // TODO: implement search
      },
      slot3: {
        id: 'create',
        label: 'Nueva Lista',
        onClick: () => openModal('list', { boardId: currentBoardId }),
        variant: 'primary'
      },
      slot4: {
        id: 'filter',
        label: 'Filtros',
        onClick: () => {} // TODO: implement filters
      },
      slot5: {
        id: 'clear',
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
    title: "Tareas para Hacer",
    showSearch: false,
    actions: []
  };

  // Loading state
  if (boardsLoading) {
    const loadingHeaderProps = {
      title: "Tareas para Hacer",
      showSearch: false,
      actions: []
    };

    return (
      <Layout headerProps={loadingHeaderProps} wide={true}>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state with EmptyState
  if (boards.length === 0) {
    const emptyHeaderProps = {
      title: "Tareas para Hacer",
      showSearch: false,
      actions: []
    };

    return (
      <Layout headerProps={emptyHeaderProps} wide={true}>
          features={[
            {
              title: "Tableros Kanban organizados",
              description: "Gestiona tus tareas con un sistema visual tipo Kanban donde puedes organizar las tareas en listas personalizables como 'Por hacer', 'En progreso' y 'Completadas', facilitando el seguimiento del flujo de trabajo."
            },
            {
              title: "Listas flexibles y personalizables",
              description: "Crea tantas listas como necesites dentro de cada tablero, asigna responsables, establece fechas límite y mueve las tareas fácilmente entre diferentes estados según avance el proyecto."
            },
            {
              title: "Seguimiento de completitud",
              description: "Marca tareas como completadas con un sistema de checkbox visual, mantén un historial de tareas terminadas y visualiza el progreso general del equipo en tiempo real."
            },
            {
              title: "Colaboración en equipo",
              description: "Asigna tareas a miembros específicos del equipo, agrega descripciones detalladas, comenta en las tareas y mantén a todos informados sobre el progreso del proyecto."
            }
          ]}
        />

        {/* ActionBar Desktop - ALWAYS VISIBLE */}
        <ActionBarDesktop
          showProjectSelector={false}
          features={[
            {
              title: "Organización visual tipo Kanban",
              description: "Sistema de tableros visuales que permite gestionar el flujo de trabajo mediante listas personalizables como 'Por hacer', 'En progreso' y 'Completadas' para un seguimiento intuitivo del estado de cada tarea."
            },
            {
              title: "Múltiples tableros por organización",
              description: "Capacidad de crear tableros independientes para diferentes proyectos o áreas de trabajo, cada uno con sus propias listas y tareas específicas para mejor organización."
            },
            {
              title: "Colaboración y asignación de responsables",
              description: "Sistema completo de asignación de tareas a miembros del equipo con fechas límite, descripciones detalladas y seguimiento del progreso individual y grupal."
            },
            {
              title: "Gestión flexible de contenido",
              description: "Funcionalidad drag & drop para reorganizar tareas entre listas, edición rápida de contenido, y herramientas de búsqueda y filtrado para localizar información específica."
            }
          ]}
          customActions={[
            <CustomRestricted 
              key="nuevo-tablero"
              feature="max_kanban_boards" 
              current={boards.length}
            >
              <Button onClick={() => openModal('board', {})}>
                Nuevo Tablero
              </Button>
            </CustomRestricted>
          ]}
        />

        <EmptyState
          description="Crea tu primer tablero para comenzar a organizar tareas"
        />
      </Layout>
    );
  }

  const selectedBoard = boards.find(board => board.id === currentBoardId);

  return (
    <Layout headerProps={headerProps} wide={true}>
        features={[
          {
            title: "Tableros Kanban organizados",
            description: "Gestiona tus tareas con un sistema visual tipo Kanban donde puedes organizar las tareas en listas personalizables como 'Por hacer', 'En progreso' y 'Completadas', facilitando el seguimiento del flujo de trabajo."
          },
          {
            title: "Listas flexibles y personalizables",
            description: "Crea tantas listas como necesites dentro de cada tablero, asigna responsables, establece fechas límite y mueve las tareas fácilmente entre diferentes estados según avance el proyecto."
          },
          {
            title: "Seguimiento de completitud",
            description: "Marca tareas como completadas con un sistema de checkbox visual, mantén un historial de tareas terminadas y visualiza el progreso general del equipo en tiempo real."
          },
          {
            title: "Colaboración en equipo",
            description: "Asigna tareas a miembros específicos del equipo, agrega descripciones detalladas, comenta en las tareas y mantén a todos informados sobre el progreso del proyecto."
          }
        ]}
      />

      {/* ActionBar Desktop */}
      <ActionBarDesktop
        features={[
          {
            title: "Organización visual tipo Kanban",
            description: "Sistema de tableros visuales que permite gestionar el flujo de trabajo mediante listas personalizables como 'Por hacer', 'En progreso' y 'Completadas' para un seguimiento intuitivo del estado de cada tarea."
          },
          {
            title: "Múltiples tableros por organización",
            description: "Capacidad de crear tableros independientes para diferentes proyectos o áreas de trabajo, cada uno con sus propias listas y tareas específicas para mejor organización."
          },
          {
            title: "Colaboración y asignación de responsables",
            description: "Sistema completo de asignación de tareas a miembros del equipo con fechas límite, descripciones detalladas y seguimiento del progreso individual y grupal."
          },
          {
            title: "Gestión flexible de contenido",
            description: "Funcionalidad drag & drop para reorganizar tareas entre listas, edición rápida de contenido, y herramientas de búsqueda y filtrado para localizar información específica."
          }
        ]}
        primaryActionLabel="Nueva Lista"
        onPrimaryActionClick={() => {
          if (currentBoardId) {
            openModal('list', { boardId: currentBoardId })
          }
        }}
        customActions={[
          <CustomRestricted 
            key="nuevo-tablero"
            feature="max_kanban_boards" 
            current={boards.length}
          >
            <Button 
              variant="secondary" 
              onClick={() => openModal('board', {})}
            >
              Nuevo Tablero
            </Button>
          </CustomRestricted>
        ]}
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