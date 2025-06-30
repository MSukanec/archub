import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomKanban } from '@/components/ui-custom/misc/CustomKanban';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus } from 'lucide-react';
import { useKanbanBoards, useKanbanLists, useKanbanCards, useMoveKanbanCard, useCreateKanbanBoard, useCreateKanbanList } from '@/hooks/use-kanban';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NewBoardModal } from '@/modals/tasks/NewBoardModal';
import { NewListModal } from '@/modals/tasks/NewListModal';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Diseñar mockups de la nueva interfaz',
    description: 'Crear los diseños iniciales para la página de dashboard con enfoque en UX/UI moderno',
    priority: 'high',
    assignee: 'María'
  },
  {
    id: 'task-2',
    title: 'Configurar base de datos',
    description: 'Implementar las tablas necesarias en Supabase para el módulo de tareas',
    priority: 'medium',
    assignee: 'Carlos'
  },
  {
    id: 'task-3',
    title: 'Revisar documentación técnica',
    description: 'Actualizar la documentación del proyecto con los nuevos cambios implementados',
    priority: 'low',
    assignee: 'Ana'
  },
  {
    id: 'task-4',
    title: 'Implementar autenticación',
    description: 'Desarrollar el sistema de login y registro de usuarios con Supabase Auth',
    priority: 'high',
    assignee: 'Luis'
  },
  {
    id: 'task-5',
    title: 'Testing de componentes',
    description: 'Escribir pruebas unitarias para los componentes principales del sistema',
    priority: 'medium',
    assignee: 'Sofia'
  },
  {
    id: 'task-6',
    title: 'Optimizar rendimiento',
    description: 'Revisar y optimizar las consultas a la base de datos para mejorar la velocidad',
    priority: 'low',
    assignee: 'Pedro'
  },
  {
    id: 'task-7',
    title: 'Deploy a producción',
    description: 'Configurar el entorno de producción y realizar el deploy de la aplicación',
    priority: 'high',
    assignee: 'María'
  },
  {
    id: 'task-8',
    title: 'Integración con APIs externas',
    description: 'Conectar la aplicación con servicios de terceros necesarios para el proyecto',
    priority: 'medium',
    assignee: 'Carlos'
  }
];

const mockTaskLists: TaskList[] = [
  {
    id: 'list-1',
    title: 'Por Hacer',
    taskIds: ['task-1', 'task-2', 'task-3'],
    color: 'gray'
  },
  {
    id: 'list-2',
    title: 'En Progreso',
    taskIds: ['task-4', 'task-5'],
    color: 'blue'
  },
  {
    id: 'list-3',
    title: 'En Revisión',
    taskIds: ['task-6'],
    color: 'yellow'
  },
  {
    id: 'list-4',
    title: 'Completado',
    taskIds: ['task-7', 'task-8'],
    color: 'green'
  }
];

export default function Tasks() {
  const handleTaskMove = (taskId: string, sourceListId: string, destListId: string, destIndex: number) => {
    console.log(`Moved task ${taskId} from ${sourceListId} to ${destListId} at position ${destIndex}`);
    // Here you would typically update the backend/database
    // For now, we just log the movement
  };

  return (
    <Layout 
      headerProps={{
        title: "Gestión de Tareas",
        showSearch: false,
        actions: []
      }}
    >
      <div className="h-full">
        <CustomKanban 
          tasks={mockTasks}
          taskLists={mockTaskLists}
          onTaskMove={handleTaskMove}
        />
      </div>
    </Layout>
  );
}