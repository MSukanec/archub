import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, User, MessageSquare, Paperclip, Plus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { KanbanList, KanbanCard } from '@/hooks/use-kanban';
import { CardDetailsModal } from '@/modals/tasks/CardDetailsModal';
import { NewCardModal } from '@/modals/tasks/NewCardModal';

interface CustomKanbanProps {
  lists: KanbanList[];
  cards: KanbanCard[];
  boardId: string;
  onCardMove?: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => void;
  loading?: boolean;
}

export function CustomKanban({ lists, cards, boardId, onCardMove, loading }: CustomKanbanProps) {
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [newCardListId, setNewCardListId] = useState<string | null>(null);

  // Group cards by list
  const cardsByList = cards.reduce((acc, card) => {
    if (!acc[card.list_id]) {
      acc[card.list_id] = [];
    }
    acc[card.list_id].push(card);
    return acc;
  }, {} as Record<string, KanbanCard[]>);

  // Sort cards by position within each list
  Object.keys(cardsByList).forEach(listId => {
    cardsByList[listId].sort((a, b) => a.position - b.position);
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (onCardMove) {
      onCardMove(
        draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index
      );
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Sin prioridad';
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

  if (lists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">No hay listas en este tablero</div>
          <div className="text-sm text-muted-foreground">
            Crea tu primera lista para comenzar a organizar tareas
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              {/* List Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {list.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: list.color }}
                      />
                    )}
                    <h3 className="font-semibold text-sm">{list.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {cardsByList[list.id]?.length || 0}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewCardListId(list.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cards Container */}
              <Droppable droppableId={list.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/20' : ''
                    }`}
                  >
                    {cardsByList[list.id]?.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                            onClick={() => setSelectedCard(card)}
                          >
                            {/* Card Title */}
                            <div className="font-medium text-sm mb-2 line-clamp-2">
                              {card.title}
                            </div>

                            {/* Card Description */}
                            {card.description && (
                              <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                {card.description}
                              </div>
                            )}

                            {/* Card Metadata */}
                            <div className="space-y-2">
                              {/* Due Date */}
                              {card.due_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(card.due_date), 'dd MMM', { locale: es })}
                                </div>
                              )}

                              {/* Bottom Row */}
                              <div className="flex items-center justify-between">
                                {/* Assigned User */}
                                <div className="flex items-center gap-1">
                                  {card.assigned_user ? (
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-5 w-5">
                                        {card.assigned_user.avatar_url && (
                                          <AvatarImage src={card.assigned_user.avatar_url} />
                                        )}
                                        <AvatarFallback className="text-xs">
                                          {card.assigned_user.full_name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {card.assigned_user.full_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      Sin asignar
                                    </div>
                                  )}
                                </div>

                                {/* Action Icons */}
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>0</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Paperclip className="h-3 w-3" />
                                    <span>0</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Add Card Button */}
                    {cardsByList[list.id]?.length === 0 && (
                      <Button
                        variant="ghost"
                        className="w-full h-12 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40"
                        onClick={() => setNewCardListId(list.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar tarjeta
                      </Button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modals */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {newCardListId && (
        <NewCardModal
          listId={newCardListId}
          open={!!newCardListId}
          onClose={() => setNewCardListId(null)}
        />
      )}
    </>
  );
}