import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Edit, Trash2, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGlobalModalStore } from '@/components/modal';
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
interface SortableCardProps {
  card: KanbanCard;
  onCardEdit?: (card: KanbanCard) => void;
  onDeleteCard?: (cardId: string) => void;
  handleToggleCompleted: (cardId: string, isCompleted: boolean) => void;
  openModal: (type: string, payload: any) => void;
  isDragOverlay?: boolean;
}
function SortableCard({ card, onCardEdit, onDeleteCard, handleToggleCompleted, openModal, isDragOverlay }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const creatorInfo = card.creator ? {
    name: card.creator.full_name || card.creator.email || 'Usuario',
    avatar: card.creator.avatar_url || undefined,
    initials: card.creator.full_name?.split('').map(n => n[0]).join('') || 'U'
  } : {
    name: 'Usuario',
    avatar: undefined,
    initials: 'U'
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 cursor-pointer hover:shadow-sm transition-shadow relative group ${
        isDragging && !isDragOverlay ? 'opacity-50': ''
      } ${isDragOverlay ? 'shadow-md rotate-1': ''}`}
      onClick={() => onCardEdit?.(card)}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-white/90 shadow-sm hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onCardEdit?.(card);
          }}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-white/90 shadow-sm hover:bg-white text-red-500 hover:text-red-600"
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
      <div className="flex items-start gap-2 mb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="flex-shrink-0 mt-0.5"
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
      
      <div className={`text-sm font-medium mb-1 ${
        card.is_completed 
          ? 'line-through text-muted-foreground opacity-60'
          : ''
      }`}>
        {card.title}
      </div>
      {card.description && (
        <div className={`text-xs text-muted-foreground line-clamp-2 ${
          card.is_completed ? 'opacity-50': ''
        }`}>
          {card.description}
        </div>
      )}
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
  );
}
interface CompletedCardProps {
  card: KanbanCard;
  onCardEdit?: (card: KanbanCard) => void;
  onDeleteCard?: (cardId: string) => void;
  handleToggleCompleted: (cardId: string, isCompleted: boolean) => void;
}
function CompletedCard({ card, onCardEdit, onDeleteCard, handleToggleCompleted }: CompletedCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const creatorInfo = card.creator ? {
    name: card.creator.full_name || card.creator.email || 'Usuario',
    avatar: card.creator.avatar_url || undefined,
    initials: card.creator.full_name?.split('').map(n => n[0]).join('') || 'U'
  } : {
    name: 'Usuario',
    avatar: undefined,
    initials: 'U'
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 cursor-pointer hover:shadow-sm transition-shadow relative group ${
        isDragging ? 'opacity-50': ''
      }`}
      onClick={() => onCardEdit?.(card)}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/90 shadow-sm hover:bg-white"
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
              className="bg-white/90 shadow-sm hover:bg-white text-red-500 hover:text-red-600"
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
      <div className="flex items-start gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 mt-0.5"
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
      
      <div className={`text-sm font-medium mb-1 ${
        card.is_completed 
          ? 'line-through text-muted-foreground opacity-60'
          : ''
      }`}>
        {card.title}
      </div>
      {card.description && (
        <div className={`text-xs text-muted-foreground line-clamp-2 ${
          card.is_completed ? 'opacity-50': ''
        }`}>
          {card.description}
        </div>
      )}
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
  );
}
interface SortableListProps {
  list: KanbanList;
  cards: KanbanCard[];
  cardsByList: Record<string, KanbanCard[]>;
  boardId: string;
  onDeleteList?: (listId: string) => void;
  onCardEdit?: (card: KanbanCard) => void;
  onDeleteCard?: (cardId: string) => void;
  handleToggleCompleted: (cardId: string, isCompleted: boolean) => void;
  openModal: (type: string, payload: any) => void;
  completedAccordionState: Record<string, boolean>;
  setCompletedAccordionState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isOver?: boolean;
}
function SortableList({
  list,
  cardsByList,
  boardId,
  onDeleteList,
  onCardEdit,
  onDeleteCard,
  handleToggleCompleted,
  openModal,
  completedAccordionState,
  setCompletedAccordionState,
  isOver,
}: SortableListProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${list.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const activeCards = cardsByList[list.id]?.filter(card => !card.is_completed) || [];
  const completedCards = cardsByList[list.id]?.filter(card => card.is_completed) || [];
  const activeCardIds = activeCards.map(card => card.id);
  const completedCardIds = completedCards.map(card => card.id);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-full md:w-80 snap-center md:snap-align-none"
    >
      <div className={`h-fit w-full md:max-w-none mx-3 md:mx-0 ${isDragging ? 'shadow-lg rotate-1 opacity-50': ''}`}>
        <div 
          {...attributes}
          {...listeners}
          className="flex items-center justify-between pb-3 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-sm">{list.name}</h3>
            <span className="text-sm text-muted-foreground">
              {activeCards.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {list.creator && (
              <Avatar className="h-5 w-5">
                {list.creator.avatar_url && <AvatarImage src={list.creator.avatar_url} />}
                <AvatarFallback className="text-xs">
                  {list.creator.full_name?.split('').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
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
        
        <div className="w-full h-0.5 bg-accent mb-4"></div>
        <div>
          <Button
            onClick={() => openModal('card', { listId: list.id, boardId })}
            className="w-full mb-2 h-8 justify-start"
          >
            <Plus className="h-3 w-3 mr-2" />
            Añade una tarjeta
          </Button>
          <SortableContext items={activeCardIds} strategy={verticalListSortingStrategy}>
            <div
              className={`space-y-2 min-h-[80px] transition-colors ${
                isOver ? 'bg-accent/10': ''
              }`}
              data-list-id={list.id}
            >
              {activeCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  onCardEdit={onCardEdit}
                  onDeleteCard={onDeleteCard}
                  handleToggleCompleted={handleToggleCompleted}
                  openModal={openModal}
                />
              ))}
              {completedCards.length > 0 && (
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
                        <ChevronRight className={`h-4 w-4 transition-transform ${completedAccordionState[list.id] ? 'rotate-90': ''}`} />
                        <span className="ml-1">Completadas ({completedCards.length})</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <SortableContext items={completedCardIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {completedCards.map((card) => (
                            <CompletedCard
                              key={card.id}
                              card={card}
                              onCardEdit={onCardEdit}
                              onDeleteCard={onDeleteCard}
                              handleToggleCompleted={handleToggleCompleted}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
export function KanbanBox({ lists, cards, boardId, onCardMove, onCreateList, onDeleteList, onDeleteCard, onCardEdit, loading }: KanbanBoxProps) {
  const [completedAccordionState, setCompletedAccordionState] = useState<Record<string, boolean>>({});
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeCardSourceListId, setActiveCardSourceListId] = useState<string | null>(null);
  const { openModal } = useGlobalModalStore();
  
  const toggleCompletedMutation = useToggleKanbanCardCompleted();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );
  const cardsByList = useMemo(() => {
    const result = (cards || []).reduce((acc, card) => {
      if (!acc[card.list_id]) {
        acc[card.list_id] = [];
      }
      acc[card.list_id].push(card);
      return acc;
    }, {} as Record<string, KanbanCard[]>);
    Object.keys(result).forEach(listId => {
      result[listId].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
          return a.is_completed ? 1 : -1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });
    return result;
  }, [cards]);
  const listIds = useMemo(() => lists.map(list => `list-${list.id}`), [lists]);
  const handleToggleCompleted = (cardId: string, isCompleted: boolean) => {
    if (!boardId) return;
    
    toggleCompletedMutation.mutate({
      cardId,
      isCompleted,
      boardId
    });
  };
  const findListIdByCardId = (cardId: string): string | null => {
    for (const [listId, listCards] of Object.entries(cardsByList)) {
      if (listCards.some(card => card.id === cardId)) {
        return listId;
      }
    }
    return null;
  };
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    if (!activeId.startsWith('list-')) {
      const card = cards.find(c => c.id === activeId);
      if (card) {
        setActiveCard(card);
        setActiveCardSourceListId(card.list_id);
      }
    }
  };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId.startsWith('list-')) return;
    
    const activeListId = findListIdByCardId(activeId);
    let overListId: string | null = null;
    
    if (overId.startsWith('list-')) {
      overListId = overId.replace('list-', '');
    } else {
      overListId = findListIdByCardId(overId);
    }
    
    if (!activeListId || !overListId || activeListId === overListId) return;
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveCard(null);
    
    if (!over || !active) {
      setActiveCardSourceListId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId.startsWith('list-')) {
      setActiveCardSourceListId(null);
      return;
    }
    
    if (!onCardMove) {
      setActiveCardSourceListId(null);
      return;
    }
    
    const sourceListId = activeCardSourceListId || findListIdByCardId(activeId);
    if (!sourceListId) {
      setActiveCardSourceListId(null);
      return;
    }
    
    let destListId: string;
    let destIndex: number;
    
    if (overId.startsWith('list-')) {
      destListId = overId.replace('list-', '');
      destIndex = cardsByList[destListId]?.filter(c => !c.is_completed).length || 0;
    } else {
      const overListId = findListIdByCardId(overId);
      if (!overListId) {
        setActiveCardSourceListId(null);
        return;
      }
      
      destListId = overListId;
      const destCards = cardsByList[destListId]?.filter(c => !c.is_completed) || [];
      destIndex = destCards.findIndex(c => c.id === overId);
      
      if (destIndex === -1) {
        destIndex = destCards.length;
      }
    }
    
    if (sourceListId === destListId && activeId === overId) {
      setActiveCardSourceListId(null);
      return;
    }
    
    onCardMove(activeId, sourceListId, destListId, destIndex);
    setActiveCardSourceListId(null);
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
          <div 
            className="flex h-full overflow-x-auto pb-4 gap-0 md:gap-4 snap-x snap-mandatory md:snap-none md:justify-start"
            style={{ minWidth: 'fit-content', width: '100%'}}
          >
            {lists.map((list) => (
              <SortableList
                key={list.id}
                list={list}
                cards={cards}
                cardsByList={cardsByList}
                boardId={boardId}
                onDeleteList={onDeleteList}
                onCardEdit={onCardEdit}
                onDeleteCard={onDeleteCard}
                handleToggleCompleted={handleToggleCompleted}
                openModal={openModal}
                completedAccordionState={completedAccordionState}
                setCompletedAccordionState={setCompletedAccordionState}
              />
            ))}
            
            <div className="flex-shrink-0 w-full md:w-80 snap-center md:snap-align-none">
              <Card className="w-full h-fit bg-muted/20 border-dashed border-2 hover:bg-muted/30 transition-colors mx-3 md:mx-0 relative overflow-hidden" style={{ borderColor: 'hsl(var(--accent))'}}>
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
                  style={{ color: 'hsl(var(--accent))'}}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añade otra lista
                </Button>
              </Card>
            </div>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeCard ? (
            <SortableCard
              card={activeCard}
              onCardEdit={onCardEdit}
              onDeleteCard={onDeleteCard}
              handleToggleCompleted={handleToggleCompleted}
              openModal={openModal}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
