import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Plus, MoreHorizontal, List, Edit, Trash2, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EmptyState } from '@/components/ui-custom/EmptyState';

import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToggleKanbanCardCompleted } from '@/hooks/use-kanban';
import type { KanbanList, KanbanCard } from '@/hooks/use-kanban';

interface KanbanBoxProps {
  lists: KanbanList[];
  cards: KanbanCard[];
  boardId: string;
  onCardMove?: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => void;
  onCreateList?: () => void;
  onDeleteList?: (listId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onCardEdit?: (card: KanbanCard) => void;
  loading?: boolean;
}

export function KanbanBox({ lists, cards, boardId, onCardMove, onCreateList, onDeleteList, onDeleteCard, onCardEdit, loading }: KanbanBoxProps) {

  const [completedAccordionState, setCompletedAccordionState] = useState<Record<string, boolean>>({});
  const { openModal } = useGlobalModalStore();
  
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  const toggleCompletedMutation = useToggleKanbanCardCompleted();
  
  // Function to get creator info for a list
  const getCreatorInfo = (createdBy: string) => {
    const member = members.find(m => m.id === createdBy);
    if (!member) return null;
    return {
      name: (member as any).user?.full_name || (member as any).user?.email || 'Usuario',
      avatar: (member as any).user?.avatar_url,
      initials: (member as any).user?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'
    };
  };

  // Group cards by list
  const cardsByList = (cards || []).reduce((acc, card) => {
    if (!acc[card.list_id]) {
      acc[card.list_id] = [];
    }
    acc[card.list_id].push(card);
    return acc;
  }, {} as Record<string, KanbanCard[]>);



  // Sort cards by completion status first, then by creation date within each list
  Object.keys(cardsByList).forEach(listId => {
    cardsByList[listId].sort((a, b) => {
      // Active tasks first, completed tasks last
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      // Within each group, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  // Function to handle toggle completed
  const handleToggleCompleted = (cardId: string, isCompleted: boolean) => {
    if (!boardId) return;
    
    toggleCompletedMutation.mutate({
      cardId,
      isCompleted,
      boardId
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Handle card movement
    if (type === 'CARD' && onCardMove) {
      onCardMove(
        draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index
      );
    }

    // Handle list movement - TODO: implement list reordering
    if (type === 'LIST') {
      // List reordering not implemented yet
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-semibold">Cargando tablero...</div>
        </div>
      </div>
    );
  }



  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lists" direction="horizontal" type="LIST">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex h-full overflow-x-auto pb-4 gap-0 md:gap-4 snap-x snap-mandatory md:snap-none md:justify-start"
              style={{ minWidth: 'fit-content', width: '100%' }}
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex-shrink-0 w-full md:w-80 snap-center md:snap-align-none"
                    >
                      <div className={`h-fit w-full md:max-w-none mx-3 md:mx-0 ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}>
                        {/* List Header */}
                        <div 
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between pb-3 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-sm">{list.name}</h3>
                            <span className="text-sm text-muted-foreground">
                              {cardsByList[list.id]?.filter(card => !card.is_completed).length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {list.creator && (
                              <Avatar className="h-5 w-5">
                                {list.creator.avatar_url && <AvatarImage src={list.creator.avatar_url} />}
                                <AvatarFallback className="text-xs">
                                  {list.creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openModal('list', { boardId, list, isEditing: true })}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Editar lista
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => openModal('delete-confirmation', {
                                    mode: 'simple',
                                    title: '¿Eliminar lista?',
                                    description: `Esta acción eliminará permanentemente la lista "${list.name}" y todas sus tarjetas.`,
                                    itemName: list.name,
                                    itemType: 'lista',
                                    destructiveActionText: 'Eliminar lista',
                                    onConfirm: () => onDeleteList?.(list.id)
                                  })}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Eliminar lista
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Línea divisoria con color accent */}
                        <div className="w-full h-0.5 bg-accent mb-4"></div>

                        {/* Cards Container */}
                        <div>
                          {/* Add Card Button - Always show first */}
                          <Button
                            onClick={() => openModal('card', { listId: list.id })}
                            className="w-full mb-2 h-8 justify-start"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Añade una tarjeta
                          </Button>

                          <Droppable droppableId={list.id} type="CARD">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`space-y-2 min-h-[80px] transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-accent/10' : ''
                                }`}
                              >
                                {/* Active (non-completed) tasks */}
                                {cardsByList[list.id]?.filter(card => !card.is_completed).map((card, index) => {
                                  const creatorInfo = card.creator ? {
                                    name: card.creator.full_name || card.creator.email || 'Usuario',
                                    avatar: card.creator.avatar_url || undefined,
                                    initials: card.creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'
                                  } : {
                                    name: 'Usuario',
                                    avatar: undefined,
                                    initials: 'U'
                                  };
                                  
                                  return (
                                    <div key={card.id}>
                                      <Draggable draggableId={card.id} index={index}>
                                        {(provided, snapshot) => (
                                        <Card
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-3 cursor-pointer hover:shadow-sm transition-shadow relative group ${
                                            snapshot.isDragging ? 'shadow-md rotate-1' : ''
                                          }`}
                                          onClick={() => onCardEdit?.(card)}
                                        >
                                          {/* Hover Action Buttons */}
                                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onCardEdit?.(card);
                                              }}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white text-red-500 hover:text-red-600"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openModal('delete-confirmation', {
                                                  mode: 'simple',
                                                  title: '¿Eliminar tarjeta?',
                                                  description: `Esta acción eliminará permanentemente la tarjeta "${card.title}".`,
                                                  itemName: card.title,
                                                  itemType: 'tarjeta',
                                                  destructiveActionText: 'Eliminar tarjeta',
                                                  onConfirm: () => onDeleteCard?.(card.id)
                                                });
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>

                                          {/* Completion Status and Creator Info Header */}
                                          <div className="flex items-start gap-2 mb-2">
                                            {/* Completion Checkbox */}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 flex-shrink-0 mt-0.5"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleCompleted(card.id, !card.is_completed);
                                              }}
                                            >
                                              {card.is_completed ? (
                                                <CheckCircle className="h-4 w-4 text-primary" />
                                              ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                              )}
                                            </Button>

                                            {/* Creator Info and Date */}
                                            <div className="flex items-center justify-between flex-1 min-w-0">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-6 w-6 flex-shrink-0">
                                                  <AvatarImage src={creatorInfo?.avatar} />
                                                  <AvatarFallback className="text-xs">
                                                    {creatorInfo?.initials || 'U'}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground font-medium truncate">
                                                  {creatorInfo?.name || 'Usuario'}
                                                </span>
                                              </div>
                                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                                {new Date(card.created_at).toLocaleDateString('es-ES', {
                                                  month: 'short',
                                                  day: 'numeric'
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {/* Card Content */}
                                          <div className={`text-sm font-medium mb-1 ${
                                            card.is_completed 
                                              ? 'line-through text-muted-foreground opacity-60' 
                                              : ''
                                          }`}>
                                            {card.title}
                                          </div>
                                          {card.description && (
                                            <div className={`text-xs text-muted-foreground line-clamp-2 ${
                                              card.is_completed ? 'opacity-50' : ''
                                            }`}>
                                              {card.description}
                                            </div>
                                          )}

                                          {/* Completed Date */}
                                          {card.is_completed && card.completed_at && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground opacity-60">
                                              <CheckCircle className="h-3 w-3" />
                                              <span>Completado el {new Date(card.completed_at).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short'
                                              })}</span>
                                            </div>
                                          )}
                                        </Card>
                                      )}
                                      </Draggable>
                                    </div>
                                  );
                                })}

                                {/* Completed tasks accordion */}
                                {cardsByList[list.id]?.filter(card => card.is_completed).length > 0 && (
                                  <div className="pt-4">
                                    <Collapsible 
                                      open={completedAccordionState[list.id] || false} 
                                      onOpenChange={(open) => setCompletedAccordionState(prev => ({ ...prev, [list.id]: open }))}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="h-auto p-2 w-full justify-start text-sm text-muted-foreground hover:text-foreground data-[state=open]:text-foreground"
                                        >
                                          <ChevronRight className={`h-4 w-4 transition-transform ${completedAccordionState[list.id] ? 'rotate-90' : ''}`} />
                                          <span className="ml-1">Completadas ({cardsByList[list.id]?.filter(card => card.is_completed).length})</span>
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2">
                                        <div className="space-y-2">
                                          {cardsByList[list.id]?.filter(card => card.is_completed).map((card, completedIndex) => {
                                            const creatorInfo = card.creator ? {
                                              name: card.creator.full_name || card.creator.email || 'Usuario',
                                              avatar: card.creator.avatar_url || undefined,
                                              initials: card.creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'
                                            } : {
                                              name: 'Usuario',
                                              avatar: undefined,
                                              initials: 'U'
                                            };
                                            
                                            const actualIndex = cardsByList[list.id]?.findIndex(c => c.id === card.id) || 0;
                                            
                                            return (
                                              <div key={card.id}>
                                                <Draggable draggableId={card.id} index={actualIndex}>
                                                  {(provided, snapshot) => (
                                                    <Card
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 cursor-pointer hover:shadow-sm transition-shadow relative group ${
                                                        snapshot.isDragging ? 'shadow-md rotate-1' : ''
                                                      }`}
                                                      onClick={() => onCardEdit?.(card)}
                                                    >
                                                      {/* Hover Action Buttons */}
                                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCardEdit?.(card);
                                                          }}
                                                        >
                                                          <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white text-red-500 hover:text-red-600"
                                                              onClick={(e) => e.stopPropagation()}
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                              <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                                                              <AlertDialogDescription>
                                                                Esta acción eliminará permanentemente la tarjeta "{card.title}".
                                                              </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                              <AlertDialogAction 
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={() => onDeleteCard?.(card.id)}
                                                              >
                                                                Eliminar
                                                              </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                      </div>

                                                      {/* Completion Status and Creator Info Header */}
                                                      <div className="flex items-start gap-2 mb-2">
                                                        {/* Completion Checkbox */}
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-5 w-5 p-0 flex-shrink-0 mt-0.5"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleCompleted(card.id, !card.is_completed);
                                                          }}
                                                        >
                                                          {card.is_completed ? (
                                                            <CheckCircle className="h-4 w-4 text-primary" />
                                                          ) : (
                                                            <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                          )}
                                                        </Button>

                                                        {/* Creator Info and Date */}
                                                        <div className="flex items-center justify-between flex-1 min-w-0">
                                                          <div className="flex items-center gap-2 min-w-0">
                                                            <Avatar className="h-6 w-6 flex-shrink-0">
                                                              <AvatarImage src={creatorInfo?.avatar} />
                                                              <AvatarFallback className="text-xs">
                                                                {creatorInfo?.initials || 'U'}
                                                              </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs text-muted-foreground font-medium truncate">
                                                              {creatorInfo?.name || 'Usuario'}
                                                            </span>
                                                          </div>
                                                          <span className="text-xs text-muted-foreground flex-shrink-0">
                                                            {new Date(card.created_at).toLocaleDateString('es-ES', {
                                                              month: 'short',
                                                              day: 'numeric'
                                                            })}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Card Content */}
                                                      <div className={`text-sm font-medium mb-1 ${
                                                        card.is_completed 
                                                          ? 'line-through text-muted-foreground opacity-60' 
                                                          : ''
                                                      }`}>
                                                        {card.title}
                                                      </div>
                                                      {card.description && (
                                                        <div className={`text-xs text-muted-foreground line-clamp-2 ${
                                                          card.is_completed ? 'opacity-50' : ''
                                                        }`}>
                                                          {card.description}
                                                        </div>
                                                      )}

                                                      {/* Completed Date */}
                                                      {card.is_completed && card.completed_at && (
                                                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground opacity-60">
                                                          <CheckCircle className="h-3 w-3" />
                                                          <span>Completado el {new Date(card.completed_at).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                          })}</span>
                                                        </div>
                                                      )}
                                                    </Card>
                                                  )}
                                                </Draggable>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </div>
                                )}

                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              
              {/* Add New List Button */}
              <div className="flex-shrink-0 w-full md:w-80 snap-center md:snap-align-none">
                <Card className="w-full h-fit bg-muted/20 border-dashed border-2 hover:bg-muted/30 transition-colors mx-3 md:mx-0 relative overflow-hidden" style={{ borderColor: 'hsl(var(--accent))' }}>
                  {/* Diagonal Hatch Background Pattern */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          hsl(var(--accent)) 0px,
                          hsl(var(--accent)) 1px,
                          transparent 1px,
                          transparent 12px
                        )`
                      }}
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={onCreateList}
                    className="w-full h-12 justify-center hover:text-foreground relative z-10"
                    style={{ color: 'hsl(var(--accent))' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añade otra lista
                  </Button>
                </Card>
              </div>
              
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Modals are managed by ModalFactory now */}

    </>
  );
}