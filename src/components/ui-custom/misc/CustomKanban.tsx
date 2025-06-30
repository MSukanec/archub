import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, List, Edit, Trash2 } from 'lucide-react';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { NewCardModal } from '@/modals/tasks/NewCardModal';
import { NewListModal } from '@/modals/tasks/NewListModal';
import { CardDetailsModal } from '@/modals/tasks/CardDetailsModal';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { KanbanList, KanbanCard } from '@/hooks/use-kanban';

interface CustomKanbanProps {
  lists: KanbanList[];
  cards: KanbanCard[];
  boardId: string;
  onCardMove?: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => void;
  onCreateList?: () => void;
  onDeleteList?: (listId: string) => void;
  loading?: boolean;
}

export function CustomKanban({ lists, cards, boardId, onCardMove, onCreateList, onDeleteList, loading }: CustomKanbanProps) {
  const [newCardListId, setNewCardListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  
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

  // Sort cards by creation date (newest first) within each list
  Object.keys(cardsByList).forEach(listId => {
    cardsByList[listId].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

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
      console.log('List reordering not implemented yet');
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
      <CustomEmptyState
        icon={<List className="w-8 h-8 text-muted-foreground" />}
        title="No hay listas en este tablero"
        description="Crea tu primera lista para comenzar a organizar tareas"
        action={
          <Button onClick={onCreateList} className="h-8 px-3 text-sm">
            <Plus className="h-3 w-3 mr-1" />
            Crear Lista
          </Button>
        }
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
              className="flex gap-4 h-full overflow-x-auto pb-4"
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex-shrink-0 w-80"
                    >
                      <Card className={`h-fit ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}>
                        {/* List Header */}
                        <div 
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{list.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {cardsByList[list.id]?.length || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {list.created_by && getCreatorInfo(list.created_by) && (
                              <Avatar className="h-5 w-5">
                                {getCreatorInfo(list.created_by)?.avatar && <AvatarImage src={getCreatorInfo(list.created_by)?.avatar} />}
                                <AvatarFallback className="text-xs">{getCreatorInfo(list.created_by)?.initials}</AvatarFallback>
                              </Avatar>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingListId(list.id)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Editar lista
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="h-3 w-3 mr-2" />
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
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                        <div className="p-3">
                          {/* Add Card Button - Always show first */}
                          <Button
                            onClick={() => setNewCardListId(list.id)}
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
                                {cardsByList[list.id]?.map((card, index) => {
                                  const creatorInfo = getCreatorInfo(card.created_by);
                                  return (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                      {(provided, snapshot) => (
                                        <Card
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-3 cursor-pointer hover:shadow-sm transition-shadow ${
                                            snapshot.isDragging ? 'shadow-md rotate-1' : ''
                                          }`}
                                          onClick={() => setSelectedCard(card)}
                                        >
                                          {/* Creator Info Header */}
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Avatar className="h-6 w-6">
                                                <AvatarImage src={creatorInfo?.avatar} />
                                                <AvatarFallback className="text-xs">
                                                  {creatorInfo?.initials || 'U'}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="text-xs text-muted-foreground font-medium">
                                                {creatorInfo?.name || 'Usuario'}
                                              </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(card.created_at).toLocaleDateString('es-ES', {
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                          
                                          {/* Card Content */}
                                          <div className="text-sm font-medium mb-1">{card.title}</div>
                                          {card.description && (
                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                              {card.description}
                                            </div>
                                          )}
                                        </Card>
                                      )}
                                    </Draggable>
                                  );
                                })}
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
              <div className="flex-shrink-0">
                <Card className="w-80 h-fit bg-muted/20 border-dashed border-2 hover:bg-muted/30 transition-colors">
                  <Button
                    variant="ghost"
                    onClick={onCreateList}
                    className="w-full h-12 justify-center text-muted-foreground hover:text-foreground"
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

      {/* Modals */}
      {newCardListId && (
        <NewCardModal
          listId={newCardListId}
          open={!!newCardListId}
          onClose={() => setNewCardListId(null)}
        />
      )}
      
      {editingListId && (
        <NewListModal
          boardId={boardId}
          editingList={lists.find(l => l.id === editingListId)}
          open={!!editingListId}
          onClose={() => setEditingListId(null)}
        />
      )}

      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}