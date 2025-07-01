export interface Task {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  assignee: string;
}

export interface Phase {
  id: string;
  title: string;
  tasks: Task[];
}

export const mockPhases: Phase[] = [
  {
    id: 'phase-1',
    title: 'Anteproyecto',
    tasks: [
      {
        id: 'task-1',
        title: 'Estudio preliminar',
        startDate: '2025-07-01',
        endDate: '2025-07-08',
        assignee: 'Matías'
      },
      {
        id: 'task-2',
        title: 'Entrega cliente',
        startDate: '2025-07-09',
        endDate: '2025-07-12',
        assignee: 'Lucía'
      }
    ]
  },
  {
    id: 'phase-2',
    title: 'Proyecto Ejecutivo',
    tasks: [
      {
        id: 'task-3',
        title: 'Planos eléctricos',
        startDate: '2025-07-05',
        endDate: '2025-07-20',
        assignee: 'Carlos'
      }
    ]
  }
];