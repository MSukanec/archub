export type FieldType = 'string'| 'number'| 'date'| 'currency'| 'boolean'| 'foreign-key';
export interface TargetField {
  field: string;
  label: string;
  type: FieldType;
  required?: boolean;
  description?: string;
  foreignKeyConfig?: {
    entityName: string;
    labelKey: string;
    valueKey: string;
    options: Array<{ label: string; value: string }>;
  };
}
export type ProjectContext = 
  | { type: 'project'; projectId: string; projectName?: string }
  | { type: 'organization'; organizationId: string; organizationName?: string };
export interface FieldHelpMessage {
  message: string;
  linkText: string;
  linkPath: string;
}
export interface ImportConfig {
  entityName: string;
  entityNamePlural: string;
  targetSchema: TargetField[];
  smartColumnMapping?: Record<string, string>;
  valueMapConfig?: Record<string, Record<string, string>>;
  onImport: (rows: Record<string, any>[], onProgress?: (current: number, total: number) => void) => Promise<void>;
  aiSuggestMapping?: (header: string, schema: TargetField[]) => Promise<string | null>;
  
  /** Contexto de proyecto/organización para la importación */
  projectContext?: ProjectContext;
  
  /** Lista de proyectos disponibles para mapeo (si contexto es organización) */
  availableProjects?: Array<{ id: string; name: string }>;
  
  /** Lista de clientes disponibles para mapeo de foreign-key */
  availableClients?: Array<{ id: string; name: string }>;
  
  /** Mensajes de ayuda para campos específicos (se muestran en conflictos) */
  fieldHelpMessages?: Record<string, FieldHelpMessage>;
}
export interface ParsedData {
  headers: string[];
  rows: any[][];
  fileName: string;
  fileType: 'csv'| 'xlsx'| 'xls';
  totalRows: number;
}
export interface ColumnMapping {
  [columnIndex: number]: string | null;
}
export interface ValidationError {
  row: number;
  column: string;
  field: string;
  message: string;
  value: any;
  severity: 'error'| 'warning';
}
export interface ConflictItem {
  field: string;
  originalValue: string;
  suggestions: Array<{ label: string; value: string; similarity: number }>;
  resolved?: boolean;
  resolvedValue?: string;
}
export interface ManualMapping {
  [key: string]: string | null;
}
export interface ImportStep {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  current: boolean;
}
export interface ImportState {
  currentStep: number;
  parsedData: ParsedData | null;
  columnMapping: ColumnMapping;
  manualMappings: ManualMapping;
  validationErrors: ValidationError[];
  conflicts: ConflictItem[];
  selectedRows: Set<number>;
  isProcessing: boolean;
}
export const IMPORT_STEPS: ImportStep[] = [
  { id: 1, name: 'Vista Previa', description: 'Revisar datos importados', completed: false, current: true },
  { id: 2, name: 'Mapeo', description: 'Asignar columnas', completed: false, current: false },
  { id: 3, name: 'Validación', description: 'Verificar errores', completed: false, current: false },
  { id: 4, name: 'Conflictos', description: 'Resolver incompatibilidades', completed: false, current: false },
  { id: 5, name: 'Resumen', description: 'Confirmar importación', completed: false, current: false },
];
