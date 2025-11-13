import React, { useState, useMemo, Fragment, ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Download,
  Group,
  FileText,
  Upload,
  MoreHorizontal
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";
import { Tabs } from "@/components/ui-custom/Tabs";

type SortDirection = "asc" | "desc" | null;

// ProjectBadge component integrado en Table
interface ProjectBadgeProps {
  projectId: string | null;
  projectsMap: Record<string, { id: string; name: string; color: string | null }>;
}

function ProjectBadge({ projectId, projectsMap }: ProjectBadgeProps) {
  // Si no hay project_id, mostrar badge "General"
  if (!projectId) {
    return (
      <Badge 
        variant="secondary"
        className="text-xs px-1 py-0.5"
        style={{
          backgroundColor: 'hsl(0, 0%, 20%)',
          color: 'white',
          fontSize: '10px',
          lineHeight: '12px'
        }}
      >
        Organización
      </Badge>
    );
  }

  // Buscar el proyecto en el mapa
  const project = projectsMap[projectId];
  
  if (!project) {
    return (
      <Badge 
        variant="secondary"
        className="text-xs px-1 py-0.5"
        style={{
          backgroundColor: 'hsl(0, 0%, 20%)',
          color: 'white',
          fontSize: '10px',
          lineHeight: '12px'
        }}
      >
        Proyecto no encontrado
      </Badge>
    );
  }

  // Determinar el color del badge
  const backgroundColor = project.color || '#000000';
  
  // Truncar el nombre si es muy largo
  const displayName = project.name.length > 15 
    ? `${project.name.substring(0, 12)}...` 
    : project.name;

  return (
    <Badge 
      variant="secondary"
      className="text-xs px-1 py-0.5"
      style={{
        backgroundColor: backgroundColor,
        color: 'white',
        fontSize: '10px',
        lineHeight: '12px'
      }}
      title={project.name} // Tooltip con el nombre completo
    >
      {displayName}
    </Badge>
  );
}

interface TableProps<T = any> {
  columns: {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean; // Por defecto true, usar false para deshabilitarlo
    sortType?: "string" | "number" | "date";
    width?: string; // Nuevo: ancho personalizado (ej: "10%", "100px", etc.)
  }[];
  data: T[];
  emptyState?: React.ReactNode; // DEPRECATED: Usar emptyStateConfig en su lugar
  emptyStateConfig?: {
    icon?: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    actionButton?: {
      label: string;
      onClick: () => void;
    };
  };
  isLoading?: boolean;
  className?: string;
  // Nuevas props para selección múltiple
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  getItemId?: (item: T) => string | number;
  // Nueva prop para personalizar el estilo de las filas
  getRowClassName?: (item: T) => string;
  // Nueva prop para click-to-edit en cards
  onCardClick?: (item: T) => void;
  // Nueva prop para click en row
  onRowClick?: (item: T) => void;
  // Nueva prop para ordenamiento inicial
  defaultSort?: {
    key: string;
    direction: "asc" | "desc";
  };
  // Nueva prop para renderizado de cards en mobile
  renderCard?: (item: T) => React.ReactNode;
  // Nuevo: Espaciado opcional para cards
  cardSpacing?: string;
  // 🆕 NUEVAS FUNCIONALIDADES
  // Fila de totales al final
  renderFooterRow?: () => React.ReactNode;
  // Agrupamiento por columna
  groupBy?: keyof T | string;
  renderGroupHeader?: (groupKey: string, groupRows: T[]) => React.ReactNode;
  // Modos de visualización
  mode?: "default" | "budget" | "construction";
  // 🆕 NUEVA BARRA SUPERIOR FLEXIBLE
  topBar?: {
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
    // 🆕 NUEVA FORMA SIMPLIFICADA DE AGRUPACIÓN (opcional)
    groupingOptions?: { value: string; label: string }[];
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
    // 🆕 NUEVA FORMA SIMPLIFICADA CON COMPONENTE TABS
    tabsConfig?: {
      tabs: { value: string; label: string; icon?: React.ReactNode }[];
      value: string;
      onValueChange: (value: string) => void;
    };
    // DEPRECADO: BOTONES DE MODO A LA IZQUIERDA (mantener por compatibilidad)
    leftModeButtons?: {
      options: { key: string; label: string }[];
      activeMode?: string;
      onModeChange?: (mode: string) => void;
    };
  };
  // 🆕 DOBLE ENCABEZADO LEGACY (será reemplazado por topBar)
  headerActions?: {
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
  };
  showDoubleHeader?: boolean;
  // 🆕 SISTEMA DE ACCIONES CON MENÚ DE TRES PUNTOS
  rowActions?: (item: T) => Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  // 🆕 ACCIÓN PRINCIPAL INLINE (botón que aparece antes del menú de tres puntos)
  primaryRowAction?: (item: T) => {
    label: string;
    onClick: () => void;
  } | null;
  // 🆕 SOPORTE PARA ELEMENTOS INACTIVOS CON SEPARACIÓN VISUAL
  getIsInactive?: (item: T) => boolean;
  inactiveSeparatorLabel?: string;
  showInactiveSeparator?: boolean;
}

export { ProjectBadge };

export function Table<T = any>({
  columns,
  data,
  emptyState,
  emptyStateConfig,
  isLoading = false,
  className,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item: T) => (item as any).id,
  getRowClassName,
  onCardClick,
  onRowClick,
  defaultSort,
  renderCard,
  cardSpacing = "space-y-2",
  // 🆕 NUEVAS FUNCIONALIDADES
  renderFooterRow,
  groupBy,
  renderGroupHeader,
  mode = "default",
  // 🆕 NUEVA BARRA SUPERIOR FLEXIBLE
  topBar,
  // 🆕 DOBLE ENCABEZADO LEGACY
  headerActions,
  showDoubleHeader = false,
  // 🆕 SISTEMA DE ACCIONES CON MENÚ DE TRES PUNTOS
  rowActions,
  primaryRowAction,
  // 🆕 SOPORTE PARA ELEMENTOS INACTIVOS
  getIsInactive,
  inactiveSeparatorLabel = "Completados",
  showInactiveSeparator = true,
}: TableProps<T>) {
  // Estados internos para funcionalidad estándar
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSort?.key || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [internalFilters, setInternalFilters] = useState<any>({});
  
  // Estados para el TopBar integrado
  const [searchInputValue, setSearchInputValue] = useState("");
  
  const itemsPerPage = 100;
  const showPagination = data.length > itemsPerPage;
  
  // Usar valores internos si no se pasan por topBar
  const searchValue = topBar?.searchValue ?? internalSearchValue;
  const isFilterActive = topBar?.isFilterActive ?? Object.keys(internalFilters).length > 0;
  
  // Handlers por defecto
  const handleSearchChange = (value: string) => {
    if (topBar?.onSearchChange) {
      topBar.onSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
  };
  
  const handleClearFilters = () => {
    if (topBar?.onClearFilters) {
      topBar.onClearFilters();
    } else {
      setInternalSearchValue("");
      setInternalFilters({});
    }
  };
  
  // Filtrado básico de datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchValue) return data;
    
    return data.filter((item) => {
      // Buscar en todas las columnas de texto
      return columns.some(column => {
        const value = item[column.key as keyof T];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchValue.toLowerCase());
      });
    });
  }, [data, searchValue, columns]);
  
  /**
   * 🎨 HELPER PARA CREAR BOTONES DE POPOVER ESTÁNDAR
   * Usa este helper para crear botones consistentes en todos los popovers
   * Maneja automáticamente el estilo activo/inactivo
   */
  const createPopoverButton = (
    option: { value: string; label: string }, 
    currentValue: string, 
    onClick: (value: string) => void
  ) => {
    const isActive = currentValue === option.value;
    return (
      <Button
        key={option.value}
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onClick(option.value)}
        className={cn(
          "w-full justify-start text-xs font-normal h-8",
          isActive ? "button-secondary-pressed hover:bg-secondary" : ""
        )}
      >
        {option.label}
      </Button>
    );
  };

  /**
   * 🔧 HELPER PARA CREAR POPOVERS ESTÁNDAR
   * Crea la estructura estándar de un popover con título y botones
   */
  const createStandardPopover = (
    title: string,
    options: { value: string; label: string }[],
    currentValue: string,
    onChange: (value: string) => void
  ) => {
    return (
      <>
        <div className="text-xs font-medium mb-2 block">{title}</div>
        <div className="space-y-1">
          {options.map((option) => createPopoverButton(option, currentValue, onChange))}
        </div>
      </>
    );
  };

  // Renderizado de contenido de filtros por defecto
  const defaultFilterContent = () => {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium mb-2 block">Filtros disponibles</div>
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          Funcionalidad de filtros personalizada no configurada para esta tabla.
        </div>
      </div>
    );
  };
  
  /**
   * 🔄 CONTENIDO DE AGRUPACIÓN POR DEFECTO
   * Si no se proporciona renderGroupingContent, se usa este contenido por defecto
   * Puedes extender topBar con groupingOptions para personalizar las opciones
   */
  const defaultGroupingContent = () => {
    // Si se proporcionan opciones personalizadas, úsalas; si no, usa la opción por defecto
    const groupingOptions = topBar?.groupingOptions || [
      { value: 'none', label: 'Sin agrupar' }
    ];
    
    const currentValue = topBar?.currentGrouping || 'none';
    const onChange = topBar?.onGroupingChange || (() => {});

    return createStandardPopover("Agrupar por", groupingOptions, currentValue, onChange);
  };

  // Renderizado de contenido de exportación por defecto
  const defaultExportContent = () => {
    const exportOptions = [
      { 
        key: 'excel', 
        label: 'Exportar a Excel', 
        icon: Download,
        onClick: topBar?.onExport
      },
      { 
        key: 'pdf', 
        label: 'Exportar a PDF', 
        icon: FileText,
        onClick: topBar?.onExportPDF
      }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Exportar como</div>
        <div className="space-y-1">
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.key}
                variant="ghost"
                size="sm"
                onClick={option.onClick}
                disabled={topBar?.isExporting ?? false}
                className="w-full justify-start text-xs font-normal h-8 gap-2"
              >
                <IconComponent className="h-3 w-3" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </>
    );
  };

  // Handler interno para búsqueda del TopBar
  const handleTopBarSearchChange = (value: string) => {
    setSearchInputValue(value);
    const onChangeHandler = topBar?.onSearchChange ?? handleSearchChange;
    onChangeHandler?.(value);
  };

  // Función para renderizar el TopBar integrado
  const renderTopBar = () => {
    const tabs = topBar?.tabs || [];
    const showSearch = topBar?.showSearch ?? true;
    const showFilter = topBar?.showFilter ?? true;
    const showSort = topBar?.showSort ?? false;
    const showClearFilters = topBar?.showClearFilters ?? true;
    
    const hasContent = tabs.length > 0 || showSearch || showFilter || showSort || showClearFilters || topBar?.leftModeButtons?.options.length || true; // Siempre true porque los botones de agrupación y exportación siempre están presentes
    
    if (!hasContent) return null;

    return (
      <div className="hidden lg:block border-b border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Lado izquierdo - Tabs y Botones de modo */}
          <div className="flex items-center gap-3">
            {/* Tabs usando el componente Tabs.tsx */}
            {topBar?.tabsConfig && (
              <Tabs
                tabs={topBar.tabsConfig.tabs}
                value={topBar.tabsConfig.value}
                onValueChange={topBar.tabsConfig.onValueChange}
              />
            )}

            {/* LEGACY: Botones de modo - mantener por compatibilidad */}
            {!topBar?.tabsConfig && topBar?.leftModeButtons && (
              <div className="flex items-center gap-1">
                {topBar.leftModeButtons.options.map((option) => (
                  <Button
                    key={option.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => topBar.leftModeButtons?.onModeChange?.(option.key)}
                    className={cn(
                      "text-xs h-8 px-3",
                      topBar.leftModeButtons?.activeMode === option.key
                        ? "button-secondary-pressed hover:bg-secondary"
                        : ""
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
            
            {/* LEGACY: Tabs antiguos - mantener por compatibilidad */}
            {!topBar?.tabsConfig && tabs.length > 0 && (
              <div className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab}
                    variant={topBar?.activeTab === tab ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => topBar?.onTabChange?.(tab)}
                    className={cn(
                      "h-8 px-3 text-xs font-normal",
                      topBar?.activeTab === tab ? "button-secondary-pressed hover:bg-secondary" : ""
                    )}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Lado derecho - Búsqueda, Orden, Filtros */}
          <div className="flex items-center gap-1">
            {/* Buscador */}
            {showSearch && (
              <div 
                className={cn(
                  "inline-flex items-center justify-start whitespace-nowrap rounded-lg text-xs",
                  "bg-transparent text-[var(--button-ghost-text)] hover:bg-transparent hover:text-[var(--button-ghost-hover-text)] border border-[var(--button-ghost-border)] hover:border-[var(--button-ghost-hover-border)]",
                  "h-8 px-2 py-2 gap-1.5 w-96",
                  "focus-within:ring-0 focus-within:outline-none"
                )}
              >
                <Input
                  placeholder="Buscar..."
                  value={searchInputValue}
                  onChange={(e) => handleTopBarSearchChange(e.target.value)}
                  className="flex-1 h-full text-xs border-0 bg-transparent placeholder:text-[var(--muted-foreground)] focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none p-0"
                />
                {searchInputValue && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleTopBarSearchChange("")}
                    className="h-4 w-4 p-0 hover:bg-transparent focus:ring-0 focus:outline-none focus-visible:ring-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
              </div>
            )}

            {/* Botón de ordenamiento */}
            {showSort && topBar?.renderSortContent && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2",
                      topBar?.isSortActive ? "button-secondary-pressed" : ""
                    )}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="text-xs">Ordenar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-56" 
                  align="center"
                >
                  {topBar.renderSortContent()}
                </PopoverContent>
              </Popover>
            )}

            {/* Botón de filtros - Solo mostrar si hay renderFilterContent configurado */}
            {showFilter && topBar?.renderFilterContent && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2",
                      isFilterActive ? "button-secondary-pressed" : ""
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="text-xs">Filtros</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-4" 
                  align="center"
                >
                  <div className="space-y-4">
                    {/* Botón limpiar filtros dentro del popover si hay filtros activos */}
                    {isFilterActive && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={topBar?.onClearFilters ?? handleClearFilters}
                        className="w-full gap-2"
                      >
                        <X className="h-4 w-4" />
                        <span className="text-xs">Limpiar Filtros</span>
                      </Button>
                    )}
                    {topBar.renderFilterContent()}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Botón de agrupación - Solo visible si showGrouping está habilitado */}
            {topBar?.groupingOptions && topBar.groupingOptions.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2",
                      topBar?.isGroupingActive ? "button-secondary-pressed" : ""
                    )}
                  >
                    <Group className="h-4 w-4" />
                    <span className="text-xs">Agrupar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-4" 
                  align="center"
                >
                  {(topBar?.renderGroupingContent ?? defaultGroupingContent)()}
                </PopoverContent>
              </Popover>
            )}

            {/* Botón de importar */}
            {topBar?.showImport && (
              <PlanRestricted 
                functionName="Importación de Excel"
                reason="general_mode"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={topBar.onImport}
                  disabled={topBar.isImporting}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Importar</span>
                </Button>
              </PlanRestricted>
            )}

            {/* Botón de exportar - Solo visible si showExport está habilitado */}
            {topBar?.showExport && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">Exportar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  {(topBar?.renderExportContent ?? defaultExportContent)()}
                </PopoverContent>
              </Popover>
            )}

            {/* Acciones personalizadas */}
            {topBar?.customActions}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to handle sort logic
  const handleSort = (
    key: string,
    sortType: "string" | "number" | "date" = "string",
  ) => {
    if (sortKey === key) {
      setSortDirection((prev) => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    if (sortDirection === null) {
      setSortKey(null);
    }
  };

  // 🆕 AGRUPAMIENTO DE DATOS CON SOPORTE PARA ELEMENTOS INACTIVOS
  const groupedData = useMemo(() => {
    // Helper: Función para ordenar un array de datos
    const sortData = (dataToSort: T[]) => {
      if (!sortKey || !sortDirection) return dataToSort;

      return [...dataToSort].sort((a, b) => {
        const column = columns.find((col) => col.key === sortKey);
        const sortType = column?.sortType || "string";

        const aValue = a[sortKey as keyof T];
        const bValue = b[sortKey as keyof T];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? -1 : 1;
        if (bValue == null) return sortDirection === "asc" ? 1 : -1;

        let comparison = 0;

        switch (sortType) {
          case "number":
            comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
            break;
          case "date":
            const dateA = new Date(String(aValue));
            const dateB = new Date(String(bValue));
            comparison = dateA.getTime() - dateB.getTime();
            
            // If dates are equal and we're sorting by movement_date, 
            // use created_at as secondary criteria
            if (comparison === 0 && sortKey === "movement_date") {
              const createdA = new Date(String((a as any).created_at || aValue));
              const createdB = new Date(String((b as any).created_at || bValue));
              comparison = createdA.getTime() - createdB.getTime();
            }
            break;
          case "string":
          default:
            comparison = String(aValue).localeCompare(String(bValue));
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    };

    // 🆕 Si hay función getIsInactive, separar activos e inactivos
    let sortedData: T[];
    if (getIsInactive) {
      const activeItems = filteredData.filter(item => !getIsInactive(item));
      const inactiveItems = filteredData.filter(item => getIsInactive(item));
      
      // Ordenar cada grupo por separado
      const sortedActive = sortData(activeItems);
      const sortedInactive = sortData(inactiveItems);
      
      // Combinar: activos primero, luego inactivos
      sortedData = [...sortedActive, ...sortedInactive];
    } else {
      // Comportamiento normal si no hay separación de inactivos
      sortedData = sortData(filteredData);
    }

    // Si no hay agrupamiento, devolver los datos como un solo grupo
    if (!groupBy) {
      return { 'all': sortedData };
    }

    // Agrupar datos por la clave especificada
    const grouped = sortedData.reduce((acc, item) => {
      const groupKey = String(item[groupBy as keyof T] || 'Sin grupo');
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    return grouped;
  }, [filteredData, sortKey, sortDirection, columns, groupBy, getIsInactive]);

  // Aplanar datos agrupados para paginación
  const flattenedData = useMemo(() => {
    return Object.values(groupedData).flat();
  }, [groupedData]);

  // Pagination - usando flattenedData en lugar de sortedData
  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);
  const paginatedData = showPagination
    ? flattenedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      )
    : flattenedData;

  const isItemSelected = (item: T) => {
    return selectedItems.some(
      (selectedItem) => getItemId(selectedItem) === getItemId(item),
    );
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(
        selectedItems.filter(
          (selectedItem) => getItemId(selectedItem) !== getItemId(item),
        ),
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      // Add all items from current page to selection
      const newSelectedItems = [...selectedItems];
      paginatedData.forEach((item) => {
        if (!isItemSelected(item)) {
          newSelectedItems.push(item);
        }
      });
      onSelectionChange(newSelectedItems);
    } else {
      // Remove all items from current page from selection
      const currentPageIds = new Set(
        paginatedData.map((item) => getItemId(item)),
      );
      const filteredSelection = selectedItems.filter(
        (item) => !currentPageIds.has(getItemId(item)),
      );
      onSelectionChange(filteredSelection);
    }
  };

  const getGridTemplateColumns = () => {
    // Check if all columns have the same width
    const widths = columns.map(col => col.width || "minmax(0, 1fr)");
    const allSameWidth = widths.every(w => w === widths[0]);
    
    let baseColumns: string;
    if (allSameWidth && widths[0] !== "minmax(0, 1fr)") {
      // If all have same width (percentage or px), use repeat with 1fr for equal distribution
      baseColumns = `repeat(${columns.length}, minmax(0, 1fr))`;
    } else {
      baseColumns = widths.join(" ");
    }
    
    const hasActions = !!rowActions;
    return [
      selectable ? "40px" : "",
      baseColumns,
      hasActions ? "40px" : ""
    ].filter(Boolean).join(" ");
  };

  // Function to get sort icon for column header
  const getSortIcon = (key: string) => {
    if (sortKey !== key)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-accent" />;
    if (sortDirection === "asc")
      return <ChevronUp className="ml-1 h-3 w-3 text-accent" />;
    if (sortDirection === "desc")
      return <ChevronDown className="ml-1 h-3 w-3 text-accent" />;
    return <ArrowUpDown className="ml-1 h-3 w-3 text-accent" />;
  };

  // Handle the special case for numbers with thousands formatting (accounting for TypeScript strict mode)
  const formatSortableValue = (key: string, value: any): any => {
    const column = columns.find((col) => col.key === key);
    if (column?.sortType === "number" && typeof value === "number") {
      return value as T[keyof T];
    }
    if (column?.sortType === "number" && typeof value !== "number") {
      return Number(value) as T[keyof T];
    }
    if (column?.sortType === "string" && typeof value !== "string") {
      return String(value) as T[keyof T];
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Desktop loading skeleton */}
        <div className="hidden lg:block">
          <div
            className="grid gap-2 p-4 bg-muted/50 rounded-lg"
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
          >
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-2 p-4 border rounded-lg"
              style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {columns.map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-muted/50 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile loading skeleton */}
        <div className="lg:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg mb-2">
              <div className="space-y-3">
                {columns.slice(0, 4).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Diferenciamos entre "sin datos originales" y "sin resultados de búsqueda"
  const hasOriginalData = data.length > 0;
  const hasFilteredData = filteredData.length > 0;
  const hasActiveSearch = searchValue.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
        {/* Nueva barra superior integrada */}
        {renderTopBar()}
        
        {/* Header Actions Row LEGACY - Fila superior con botones (solo si showDoubleHeader está activo) */}
        {headerActions && showDoubleHeader && (
          <div 
            className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]"
            style={{ backgroundColor: "var(--card-bg)", color: "var(--card-fg)" }}
          >
            <div className="flex items-center gap-2">
              {headerActions.leftActions}
            </div>
            <div className="flex items-center gap-2">
              {headerActions.rightActions}
            </div>
          </div>
        )}
        
        {/* Column Headers - Fila inferior con títulos de columnas */}
        <div
          className={cn(
            "grid gap-2 px-4 py-3 text-xs font-medium border-b"
          )}
          style={{ 
            gridTemplateColumns: getGridTemplateColumns(),
            backgroundColor: "var(--table-header-bg)", 
            color: "var(--table-header-fg)",
            borderBottomColor: "var(--table-header-border)"
          }}
        >
          {selectable && (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  paginatedData.length > 0 &&
                  paginatedData.every((item) => isItemSelected(item))
                }
                onCheckedChange={handleSelectAll}
                aria-label="Seleccionar todos"
                className="h-3 w-3"
              />
            </div>
          )}
          {columns.map((column) => {
            const isNumericColumn = column.sortType === "number";
            return (
              <button
                key={String(column.key)}
                className={cn(
                  "flex items-center text-left transition-colors hover:text-accent",
                  isNumericColumn ? "justify-end" : "justify-start",
                  column.sortable !== false && "cursor-pointer",
                )}
                onClick={() =>
                  column.sortable !== false &&
                  handleSort(String(column.key), column.sortType)
                }
                disabled={column.sortable === false}
              >
                {column.label}
                {column.sortable !== false && getSortIcon(String(column.key))}
              </button>
            );
          })}
          {rowActions && <div></div>}
        </div>

        {/* Table Rows con agrupamiento */}
        <div>
          {!hasOriginalData ? (
            // Mostrar empty state cuando no hay datos originales
            emptyStateConfig ? (
              <div className="p-6">
                <EmptyState
                  icon={emptyStateConfig.icon}
                  title={emptyStateConfig.title}
                  description={emptyStateConfig.description}
                  action={
                    emptyStateConfig.action || 
                    (emptyStateConfig.actionButton ? (
                      <Button onClick={emptyStateConfig.actionButton.onClick}>
                        {emptyStateConfig.actionButton.label}
                      </Button>
                    ) : undefined)
                  }
                />
              </div>
            ) : emptyState ? (
              <div className="p-8 text-center">
                {emptyState}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )
          ) : !hasFilteredData && hasActiveSearch ? (
            // Mostrar mensaje específico cuando hay búsqueda activa pero sin resultados
            <div className="p-8 text-center">
              <div className="text-sm text-muted-foreground">
                No se encontraron resultados para "{searchValue}"
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Intenta con términos diferentes o limpia la búsqueda
              </div>
            </div>
          ) : groupBy ? (
            // Renderizado con agrupamiento
            Object.entries(groupedData).map(([groupKey, groupRows]) => (
              <Fragment key={groupKey}>
                {/* Header de grupo */}
                {renderGroupHeader && (
                  <div className={cn(
                    "grid gap-2 px-4 py-3",
                    mode === "budget" && "border-b border-[var(--table-row-border)]",
                    mode === "construction" && "border-b border-[var(--table-row-border)]",
                    mode === "default" && "border-b border-[var(--table-header-border)]",
                    "text-xs font-medium [&>*]:text-xs [&>*]:font-medium [&>*]:!text-white"
                  )}
                  style={{ 
                    gridTemplateColumns: getGridTemplateColumns(),
                    backgroundColor: "var(--table-group-header-bg)",
                    color: "white"
                  }}
                  >
                    {renderGroupHeader(groupKey, groupRows)}
                  </div>
                )}
                
                {/* Filas del grupo */}
                {groupRows.map((item, index) => (
                  <div
                    key={getItemId(item)}
                    className={cn(
                      "group relative grid gap-2 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors",
                      index < groupRows.length - 1 ? "border-b border-[var(--table-row-border)]" : "",
                      getRowClassName?.(item),
                    )}
                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                  >
                    {selectable && (
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isItemSelected(item)}
                          onCheckedChange={(checked) =>
                            handleSelectItem(item, checked as boolean)
                          }
                          aria-label={`Seleccionar fila ${index + 1}`}
                          className="h-3 w-3"
                        />
                      </div>
                    )}
                    {columns.map((column) => {
                      const isNumericColumn = column.sortType === "number";
                      return (
                        <div
                          key={String(column.key)}
                          className={cn(
                            "text-xs flex items-center",
                            isNumericColumn ? "justify-end" : "justify-start",
                            mode === "budget" && "text-[var(--table-row-fg)]",
                            mode === "construction" && "text-[var(--table-row-fg)]"
                          )}
                        >
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] || "-")}
                        </div>
                      );
                    })}
                    {(rowActions || primaryRowAction) && (
                      <div className="flex items-center justify-end gap-2">
                        {primaryRowAction && (() => {
                          const action = primaryRowAction(item);
                          return action ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={action.onClick}
                              className="text-xs"
                            >
                              {action.label}
                            </Button>
                          ) : null;
                        })()}
                        {rowActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 z-50">
                              {(() => {
                                const actions = rowActions(item);
                                const defaultActions = actions.filter(a => a.variant !== 'destructive');
                                const destructiveActions = actions.filter(a => a.variant === 'destructive');
                                
                                return (
                                  <>
                                    {defaultActions.map((action, idx) => (
                                      <DropdownMenuItem
                                        key={idx}
                                        onClick={action.onClick}
                                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent hover:text-black dark:hover:text-white transition-colors"
                                      >
                                        <action.icon className="h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    ))}
                                    {destructiveActions.length > 0 && (
                                      <DropdownMenuSeparator className="bg-border" />
                                    )}
                                    {destructiveActions.map((action, idx) => (
                                      <DropdownMenuItem
                                        key={idx}
                                        onClick={action.onClick}
                                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                      >
                                        <action.icon className="h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                );
                              })()}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </Fragment>
            ))
          ) : hasFilteredData ? (
            // Renderizado sin agrupamiento (comportamiento original)
            paginatedData.map((item, index) => {
              const isInactive = getIsInactive ? getIsInactive(item) : false;
              const prevItem = index > 0 ? paginatedData[index - 1] : null;
              const prevIsInactive = prevItem && getIsInactive ? getIsInactive(prevItem) : false;
              const showSeparator = getIsInactive && showInactiveSeparator && !prevIsInactive && isInactive;

              return (
                <Fragment key={getItemId(item)}>
                  {/* Separador visual entre activos e inactivos */}
                  {showSeparator && (
                    <div className="grid gap-2 px-4 py-2 bg-[var(--table-header-bg)] border-t border-b border-[var(--table-row-border)]" style={{ gridTemplateColumns: getGridTemplateColumns() }}>
                      <div className="col-span-full text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span>{inactiveSeparatorLabel}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "group relative grid gap-2 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors",
                      index < paginatedData.length - 1
                        ? "border-b border-[var(--table-row-border)]"
                        : "",
                      isInactive && "opacity-50",
                      getRowClassName?.(item),
                    )}
                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                  >
                {selectable && (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isItemSelected(item)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item, checked as boolean)
                      }
                      aria-label={`Seleccionar fila ${index + 1}`}
                      className="h-3 w-3"
                    />
                  </div>
                )}
                {columns.map((column) => {
                  const isNumericColumn = column.sortType === "number";
                  return (
                    <div
                      key={String(column.key)}
                      className={cn(
                        "text-xs flex items-center",
                        isNumericColumn ? "justify-end" : "justify-start"
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] || "-")}
                    </div>
                  );
                })}
                {(rowActions || primaryRowAction) && (
                  <div className="flex items-center justify-end gap-2">
                    {primaryRowAction && (() => {
                      const action = primaryRowAction(item);
                      return action ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={action.onClick}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ) : null;
                    })()}
                    {rowActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 z-[70]">
                          {(() => {
                            const actions = rowActions(item);
                            const defaultActions = actions.filter(a => a.variant !== 'destructive');
                            const destructiveActions = actions.filter(a => a.variant === 'destructive');
                            
                            return (
                              <>
                                {defaultActions.map((action, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={action.onClick}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent hover:text-black dark:hover:text-white transition-colors"
                                  >
                                    <action.icon className="h-4 w-4" />
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                                {destructiveActions.length > 0 && (
                                  <DropdownMenuSeparator className="bg-border" />
                                )}
                                {destructiveActions.map((action, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={action.onClick}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                  >
                                    <action.icon className="h-4 w-4" />
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            );
                          })()}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </div>
            </Fragment>
              );
            })
          ) : null}
          
          {/* 🆕 FILA DE TOTALES */}
          {renderFooterRow && hasFilteredData && (
            <div className={cn(
              "grid gap-2 px-4 py-3",
              mode === "budget" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)]",
              mode === "construction" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)]",
              mode === "default" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)]",
              "text-xs font-medium"
            )}
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {renderFooterRow()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {!hasOriginalData ? (
          emptyStateConfig ? (
            <div className="p-6">
              <EmptyState
                icon={emptyStateConfig.icon}
                title={emptyStateConfig.title}
                description={emptyStateConfig.description}
                action={
                  emptyStateConfig.action || 
                  (emptyStateConfig.actionButton ? (
                    <Button onClick={emptyStateConfig.actionButton.onClick}>
                      {emptyStateConfig.actionButton.label}
                    </Button>
                  ) : undefined)
                }
              />
            </div>
          ) : emptyState ? (
            <div className="p-8 text-center">
              {emptyState}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )
        ) : !hasFilteredData && hasActiveSearch ? (
          <div className="p-8 text-center">
            <div className="text-sm text-muted-foreground">
              No se encontraron resultados para "{searchValue}"
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Intenta con términos diferentes o limpia la búsqueda
            </div>
          </div>
        ) : paginatedData.map((item, index) =>
          renderCard ? (
            // Use custom card renderer if provided  
            <div key={getItemId(item)} className="mb-2" onClick={() => onCardClick?.(item)}>
              {renderCard(item)}
            </div>
          ) : (
            // Default card layout
            <div
              key={getItemId(item)}
              className={cn(
                "p-3 border border-[var(--card-border)] rounded-lg mb-2 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer relative",
                getRowClassName?.(item),
              )}
              onClick={() => onCardClick?.(item)}
            >
              {rowActions && (
                <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {(() => {
                        const actions = rowActions(item);
                        const defaultActions = actions.filter(a => a.variant !== 'destructive');
                        const destructiveActions = actions.filter(a => a.variant === 'destructive');
                        
                        return (
                          <>
                            {defaultActions.map((action, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={action.onClick}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent hover:text-black dark:hover:text-white transition-colors"
                              >
                                <action.icon className="h-4 w-4" />
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                            {destructiveActions.length > 0 && (
                              <DropdownMenuSeparator className="bg-border" />
                            )}
                            {destructiveActions.map((action, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={action.onClick}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                              >
                                <action.icon className="h-4 w-4" />
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </>
                        );
                      })()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {selectable && (
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <span className="text-xs font-medium text-muted-foreground">
                    Seleccionar
                  </span>
                  <Checkbox
                    checked={isItemSelected(item)}
                    onCheckedChange={(checked) => {
                      handleSelectItem(item, checked === true);
                    }}
                    aria-label="Seleccionar elemento"
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {columns
                  .filter((_, idx) => idx < 6)
                  .map((column) => {
                    const value = column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || "-");

                    return (
                      <div
                        key={String(column.key)}
                        className="flex flex-col min-w-0"
                      >
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {column.label}
                        </span>
                        <div className="text-sm font-medium truncate">
                          {value}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {columns.length > 6 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {columns.slice(6).map((column) => {
                      const value = column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] || "-");

                      return (
                        <div
                          key={String(column.key)}
                          className="flex flex-col min-w-0"
                        >
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {column.label}
                          </span>
                          <div className="text-sm font-medium truncate">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="mt-4 pt-4 border-t border-[var(--table-border)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--muted-fg)]">
              Mostrando{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                flattenedData.length,
              )}{" "}
              a {Math.min(currentPage * itemsPerPage, flattenedData.length)} de{" "}
              {flattenedData.length} entradas
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const isVisible =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1;

                  if (
                    !isVisible &&
                    pageNum !== 2 &&
                    pageNum !== totalPages - 1
                  ) {
                    // Show ellipsis
                    if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="px-1 text-[var(--muted-fg)]"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[32px]"
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
