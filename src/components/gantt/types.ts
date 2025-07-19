export type GanttRowProps = {
  id: string;
  name: string;
  type: 'phase' | 'task';
  level: number;
  startDate: string;
  endDate?: string;           // Optional: exact end date
  durationInDays?: number;    // Optional: duration in days from start
  children?: GanttRowProps[];
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onClick?: (item: GanttRowProps) => void;
  onAddChild?: (parentId: string) => void;
};

export type GanttContainerProps = {
  data: GanttRowProps[];
  onItemClick?: (item: GanttRowProps) => void;
  onAddChild?: (parentId: string) => void;
};