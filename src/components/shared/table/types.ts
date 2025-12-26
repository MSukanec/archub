import { ReactNode, ComponentType } from "react";
import { TableColumnType } from "./tableColumnTypes";

export type SortDirection = "asc" | "desc" | null;

export type SortType = "string" | "number" | "date";

export type ColumnAlignment = "left" | "center" | "right";

export type TableMode = "default" | "budget" | "construction";

export interface Column<T = any> {
  key: keyof T | string;
  label: string;
  type?: TableColumnType;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  sortType?: SortType;
  /** @deprecated Use `type` property for semantic column widths instead */
  width?: string;
  cellClassName?: string;
  labelClassName?: string;
  align?: ColumnAlignment;
}

export interface RowAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export interface PrimaryRowAction {
  label: string;
  onClick: () => void;
}

export interface LeadingRowAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface EmptyStateConfig {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export interface TabConfig {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface GroupingOption {
  value: string;
  label: string;
}

export interface BulkActions {
  onDelete?: () => void;
  onExport?: () => void;
  customActions?: ReactNode;
}

export interface TopBarConfig {
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (newTab: string) => void;
  showSearch?: boolean;
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  showFilter?: boolean;
  renderFilterContent?: () => ReactNode;
  isFilterActive?: boolean;
  showSort?: boolean;
  renderSortContent?: () => ReactNode;
  isSortActive?: boolean;
  renderGroupingContent?: () => ReactNode;
  isGroupingActive?: boolean;
  groupingOptions?: GroupingOption[];
  currentGrouping?: string;
  onGroupingChange?: (value: string) => void;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  showImport?: boolean;
  onImport?: () => void;
  isImporting?: boolean;
  showExport?: boolean;
  onExport?: () => void;
  onExportPDF?: () => void;
  isExporting?: boolean;
  renderExportContent?: () => ReactNode;
  customActions?: ReactNode;
  tabsConfig?: {
    tabs: TabConfig[];
    value: string;
    onValueChange: (value: string) => void;
  };
  /** @deprecated Use tabsConfig instead */
  leftModeButtons?: {
    options: { key: string; label: string }[];
    activeMode?: string;
    onModeChange?: (mode: string) => void;
  };
  bulkActions?: BulkActions;
}

/** @deprecated Use topBar instead */
export interface HeaderActions {
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export interface DefaultSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  /** @deprecated Use emptyStateConfig instead */
  emptyState?: ReactNode;
  emptyStateConfig?: EmptyStateConfig;
  isLoading?: boolean;
  className?: string;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  getItemId?: (item: T) => string | number;
  getRowClassName?: (item: T) => string;
  onCardClick?: (item: T) => void;
  onRowClick?: (item: T) => void;
  defaultSort?: DefaultSort;
  renderCard?: (item: T) => ReactNode;
  cardSpacing?: string;
  renderFooterRow?: () => ReactNode;
  groupBy?: keyof T | string;
  renderGroupHeader?: (groupKey: string, groupRows: T[]) => ReactNode;
  mode?: TableMode;
  topBar?: TopBarConfig;
  /** @deprecated Use topBar instead */
  headerActions?: HeaderActions;
  /** @deprecated Use topBar instead */
  showDoubleHeader?: boolean;
  rowActions?: (item: T) => RowAction[];
  primaryRowAction?: (item: T) => PrimaryRowAction | null;
  leadingRowAction?: (item: T) => LeadingRowAction | null;
  getIsInactive?: (item: T) => boolean;
  inactiveSeparatorLabel?: string;
  showInactiveSeparator?: boolean;
  hideActions?: boolean;
}

export interface TableSortState {
  sortKey: string | null;
  sortDirection: SortDirection;
}

export interface TableFilterState {
  searchValue: string;
  filters: Record<string, any>;
}

export interface TablePaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface TableSelectionState<T> {
  selectedItems: T[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}
