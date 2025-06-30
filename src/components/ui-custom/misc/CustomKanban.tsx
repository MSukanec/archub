import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}

export interface TaskList {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
}

interface CustomKanbanProps {
  tasks: Task[];
  taskLists: TaskList[];
  onTaskMove?: (taskId: string, sourceListId: string, destListId: string, destIndex: number) => void;
}

export function CustomKanban({ tasks, taskLists, onTaskMove }: CustomKanbanProps) {
  const [lists, setLists] = useState(taskLists);
  const [taskData, setTaskData] = useState(tasks);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    // Update lists state
    const newLists = [...lists];
    const sourceList = newLists.find(list => list.id === sourceListId);
    const destList = newLists.find(list => list.id === destListId);

    if (!sourceList || !destList) return;

    // Remove task from source list
    const newSourceTaskIds = [...sourceList.taskIds];
    newSourceTaskIds.splice(source.index, 1);
    sourceList.taskIds = newSourceTaskIds;

    // Add task to destination list
    const newDestTaskIds = [...destList.taskIds];
    newDestTaskIds.splice(destination.index, 0, draggableId);
    destList.taskIds = newDestTaskIds;

    setLists(newLists);

    // Call callback if provided
    if (onTaskMove) {
      onTaskMove(draggableId, sourceListId, destListId, destination.index);
    }
  };

  const getTasksByListId = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return [];
    
    return list.taskIds
      .map(taskId => taskData.find(task => task.id === taskId))
      .filter(Boolean) as Task[];
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto p-4 min-h-[calc(100vh-200px)]">
        {lists.map((list) => (
          <div key={list.id} className="flex-shrink-0 w-80">
            <Card className="h-full bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {list.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {getTasksByListId(list.id).length}
                  </Badge>
                </div>
              </CardHeader>
              
              <Droppable droppableId={list.id}>
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/20' : ''
                    }`}
                  >
                    {getTasksByListId(list.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab transition-all duration-200 hover:shadow-md ${
                              snapshot.isDragging 
                                ? 'shadow-lg rotate-1 scale-105' 
                                : 'hover:scale-[1.02]'
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm leading-tight">
                                  {task.title}
                                </h4>
                                
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  {task.priority && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-1.5 py-0.5 ${getPriorityColor(task.priority)}`}
                                    >
                                      {task.priority}
                                    </Badge>
                                  )}
                                  
                                  {task.assignee && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                                        {task.assignee.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {task.assignee}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}