import { 
  Filter, 
  FolderTree, 
  Plus,
  Tag,
  Star,
  Coins,
  Wallet,
  Calendar,
  Search,
  Package
} from 'lucide-react'

// Re-export Plus for backwards compatibility
export { Plus } from 'lucide-react'

// Iconos estándar para filtros comunes
export const FILTER_ICONS = {
  // Filtros principales
  CATEGORY: Filter,
  PHASE: Calendar,
  TYPE: Tag,
  SEARCH: Search,
  FILTER: Filter,
  
  // Agrupación
  GROUPING: FolderTree,
  
  // Finanzas
  FAVORITES: Star,
  CURRENCY: Coins,
  WALLET: Wallet,
  
  // Construcción
  MATERIALS: Package,
} as const

// Iconos estándar para acciones comunes
export const ACTION_ICONS = {
  ADD: Plus,
  CREATE: Plus,
  NEW: Plus,
} as const

// Etiquetas estándar para filtros
export const FILTER_LABELS = {
  // Agrupación
  GROUPING: 'Agrupar',
  
  // Filtros básicos
  CATEGORY: 'Categorías',
  PHASE: 'Fases',
  TYPE: 'Tipos',
  
  // Estados - formato simplificado
  ALL_CATEGORIES: 'Todo',
  ALL_PHASES: 'Todo',
  ALL_TYPES: 'Todo',
  NO_GROUPING: 'Sin Agrupar',
  
  // Finanzas específicos - también simplificados
  FAVORITES: 'Favoritos',
  CURRENCY: 'Moneda',
  WALLET: 'Billetera',
  ALL_MOVEMENTS: 'Todo',
  ALL_CURRENCIES: 'Todo',
  ALL_WALLETS: 'Todo',
} as const

// Opciones estándar para agrupación
export const GROUPING_OPTIONS = {
  // Construcción - Materiales
  MATERIALS: ['Agrupar por Categorías'] as (string | null)[],
  
  // Construcción - Tareas
  TASKS: ['Sin Agrupar', 'Por Rubros', 'Por Fases'] as (string | null)[],
  
  // Cronograma
  SCHEDULE: ['Sin Agrupar', 'Por Rubros', 'Por Fases'] as (string | null)[],
}

// Etiquetas estándar para acciones
export const ACTION_LABELS = {
  NEW_TASK: 'Nueva Tarea',
  NEW_MATERIAL: 'Nuevo Material',
  NEW_MOVEMENT: 'Nuevo Movimiento',
  ADD_ITEM: 'Agregar',
} as const