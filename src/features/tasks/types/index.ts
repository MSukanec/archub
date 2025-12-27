export type {
  Task,
  InsertTask,
  TaskParameter,
  TaskParameterOption,
  TaskParameterOptionGroup,
  TaskParameterOptionGroupItem,
  InsertTaskParameter,
  InsertTaskParameterOption,
  InsertTaskParameterOptionGroup,
  InsertTaskParameterOptionGroupItem,
  TaskParameterDependency,
  TaskParameterDependencyOption,
  InsertTaskParameterDependency,
  InsertTaskParameterDependencyOption,
  TaskParameterPosition,
  InsertTaskParameterPosition,
  OrganizationTaskPrice,
  InsertOrganizationTaskPrice,
  MovementTask,
  InsertMovementTask,
} from '@shared/schema';

export interface GeneratedTask {
  id: string;
  code: string;
  param_values: Record<string, string>;
  param_order?: string[];
  name_rendered: string;
  custom_name?: string;
  organization_id?: string;
  is_system: boolean;
  is_completed?: boolean;
  unit: string;
  category: string;
  division?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskMaterial {
  id: string;
  task_id: string;
  material_id: string;
  amount: number;
  organization_id: string;
  created_at: string;
  materials?: {
    id: string;
    name: string;
    units: {
      name: string;
    };
  };
}

export interface TaskLabor {
  id: string;
  task_id: string;
  labor_id: string;
  labor_yield: number;
  organization_id: string;
  created_at: string;
  labor?: {
    id: string;
    name: string;
    unit?: {
      name: string;
    };
  };
}

export interface TaskCost {
  id: string;
  task_id: string;
  cost_type: 'material' | 'labor' | 'equipment' | 'subcontract' | 'other';
  item_id?: string;
  amount: number;
  unit_price: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_system: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDivision {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_system: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ParameterSelection {
  parameterId: string;
  optionId: string;
  parameterSlug: string;
  parameterLabel: string;
  optionName: string;
  optionLabel: string;
}
