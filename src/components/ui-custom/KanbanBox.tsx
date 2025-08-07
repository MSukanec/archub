import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
      name: member.user?.full_name || member.user?.email || 'Usuario',
      avatar: member.user?.avatar_url,
      initials: member.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'
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
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <EmptyState
        description="Crea tu primera lista para comenzar a organizar tareas"
      />
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
              style={{ minWidth: 'fit-content', width: '100%' }}
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <Card className={`h-fit w-full md:max-w-none mx-3 md:mx-0 ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}>
                        {/* List Header */}
                        <div 
                          {...provided.dragHandleProps}
                        >
                              {cardsByList[list.id]?.filter(card => !card.is_completed).length || 0}
                            </Badge>
                          </div>
                            {list.creator && (
                                {list.creator.avatar_url && <AvatarImage src={list.creator.avatar_url} />}
                                  {list.creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openModal('list', { boardId, list, isEditing: true })}>
                                  Editar lista
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      Eliminar lista
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente la lista "{list.name}" y todas sus tarjetas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => onDeleteList?.(list.id)}
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Cards Container */}
                          {/* Add Card Button - Always show first */}
                          <Button
                            onClick={() => openModal('card', { listId: list.id })}
                          >
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
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onCardEdit?.(card);
                                              }}
                                            >
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
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
                                                    onClick={() => onDeleteCard?.(card.id)}
                                                  >
                                                    Eliminar
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>

                                          {/* Completion Status and Creator Info Header */}
                                            {/* Completion Checkbox */}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleCompleted(card.id, !card.is_completed);
                                              }}
                                            >
                                              {card.is_completed ? (
                                              ) : (
                                              )}
                                            </Button>

                                            {/* Creator Info and Date */}
                                                  <AvatarImage src={creatorInfo?.avatar} />
                                                    {creatorInfo?.initials || 'U'}
                                                  </AvatarFallback>
                                                </Avatar>
                                                  {creatorInfo?.name || 'Usuario'}
                                                </span>
                                              </div>
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
                                    <Collapsible 
                                      open={completedAccordionState[list.id] || false} 
                                      onOpenChange={(open) => setCompletedAccordionState(prev => ({ ...prev, [list.id]: open }))}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                        >
                                          <ChevronRight className={`h-4 w-4 transition-transform ${completedAccordionState[list.id] ? 'rotate-90' : ''}`} />
                                        </Button>
                                      </CollapsibleTrigger>
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
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCardEdit?.(card);
                                                          }}
                                                        >
                                                        </Button>
                                                        <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={(e) => e.stopPropagation()}
                                                            >
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
                                                                onClick={() => onDeleteCard?.(card.id)}
                                                              >
                                                                Eliminar
                                                              </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                      </div>

                                                      {/* Completion Status and Creator Info Header */}
                                                        {/* Completion Checkbox */}
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleCompleted(card.id, !card.is_completed);
                                                          }}
                                                        >
                                                          {card.is_completed ? (
                                                          ) : (
                                                          )}
                                                        </Button>

                                                        {/* Creator Info and Date */}
                                                              <AvatarImage src={creatorInfo?.avatar} />
                                                                {creatorInfo?.initials || 'U'}
                                                              </AvatarFallback>
                                                            </Avatar>
                                                              {creatorInfo?.name || 'Usuario'}
                                                            </span>
                                                          </div>
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
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              
              {/* Add New List Button */}
                  {/* Diagonal Hatch Background Pattern */}
                    <div 
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
                    style={{ color: 'hsl(var(--accent))' }}
                  >
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