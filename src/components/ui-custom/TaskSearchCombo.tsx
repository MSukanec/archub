import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Option {
  value: string;
  label: string;
}

export interface TaskSearchFilters {
  origin: 'all' | 'system' | 'organization';
  rubro?: string;
  category?: string;
  subcategory?: string;
}

interface FilterOptions {
  rubros: string[];
  categories: string[];
  subcategories: string[];
}

interface TaskSearchComboProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  onSearchChange?: (search: string) => void;
  showCreateButton?: boolean;
  onCreateTask?: () => void;
  searchQuery?: string;
  // Nuevas props para filtros
  filters?: TaskSearchFilters;
  onFiltersChange?: (filters: TaskSearchFilters) => void;
  filterOptions?: FilterOptions;
  isLoading?: boolean;
}

export function TaskSearchCombo({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones.",
  disabled = false,
  className,
  onSearchChange,
  showCreateButton = false,
  onCreateTask,
  searchQuery = "",
  filters = { origin: 'all' },
  onFiltersChange,
  filterOptions,
  isLoading = false
}: TaskSearchComboProps) {
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  // Contar filtros activos
  const activeFiltersCount = Object.values(filters).filter(f => f && f !== 'all').length;

  return (
    <div className="flex items-center gap-2">
      {/* Filtros a la izquierda */}
      {onFiltersChange && filterOptions && (
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className={cn(
                // Usar EXACTAMENTE las mismas clases que el input de búsqueda
                "flex items-center justify-center text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
                "w-auto h-auto", // Permitir que se ajuste al contenido como el input
                activeFiltersCount > 0 && "bg-accent text-accent-foreground"
              )}
            >
              <Filter className="w-4 h-4 font-normal" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent text-accent-foreground rounded-full text-[8px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Filtros</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onFiltersChange({ origin: 'all' })}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
              
              {/* Filtro por Origen */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Origen</label>
                <Select
                  value={filters.origin || "all"}
                  onValueChange={(value: 'all' | 'system' | 'organization') => 
                    onFiltersChange({ ...filters, origin: value })
                  }
                >
                  <SelectTrigger className="h-7 text-xs border-[var(--input-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="organization">Mi Organización</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Rubro */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Rubro</label>
                <Select
                  value={filters.rubro || ""}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      rubro: value || undefined,
                      // Reset category and subcategory when rubro changes
                      category: undefined,
                      subcategory: undefined
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs border-[var(--input-border)]">
                    <SelectValue placeholder="Todos los rubros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los rubros</SelectItem>
                    {filterOptions?.rubros?.map((rubro) => (
                      <SelectItem key={rubro} value={rubro}>{rubro}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Categoría */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <Select
                  value={filters.category || ""}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      category: value || undefined,
                      // Reset subcategory when category changes
                      subcategory: undefined
                    })
                  }
                  disabled={!filters.rubro}
                >
                  <SelectTrigger className="h-7 text-xs border-[var(--input-border)]">
                    <SelectValue placeholder={filters.rubro ? "Todas las categorías" : "Selecciona rubro primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    {filterOptions?.categories?.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Subcategoría */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subcategoría</label>
                <Select
                  value={filters.subcategory || ""}
                  onValueChange={(value) => 
                    onFiltersChange({ ...filters, subcategory: value || undefined })
                  }
                  disabled={!filters.category}
                >
                  <SelectTrigger className="h-7 text-xs border-[var(--input-border)]">
                    <SelectValue placeholder={filters.category ? "Todas las subcategorías" : "Selecciona categoría primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las subcategorías</SelectItem>
                    {filterOptions?.subcategories?.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Campo de búsqueda principal */}
      <div className="flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-expanded={open}
              className={cn(
                // Styled EXACTLY like Input component from ui/input.tsx
                "flex w-full text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
                "justify-between items-center cursor-pointer",
                !selectedOption && "text-[var(--input-placeholder)]",
                className
              )}
              disabled={disabled}
            >
              <span className="truncate text-left">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 z-[9999] bg-background border border-[var(--input-border)]" 
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <Command className="bg-background rounded-md border-[var(--input-border)]" shouldFilter={false}>
              <div className="relative">
                <CommandInput 
                  placeholder={searchPlaceholder} 
                  onValueChange={onSearchChange}
                  className="text-xs h-8 border-0 bg-transparent placeholder:text-[var(--input-placeholder)] text-foreground pr-8"
                  value={searchQuery}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-accent/20"
                    onClick={() => {
                      if (onSearchChange) {
                        onSearchChange('');
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
          
          {/* Solo mostrar CommandEmpty si no hay opciones Y hay una búsqueda activa */}
          {options.length === 0 && searchQuery.length >= 3 && (
            <CommandEmpty className="text-xs py-3 px-3 text-center">
              {showCreateButton && onCreateTask ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Parece que esta tarea no existe, ¿quieres crearla tú?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onCreateTask();
                    }}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Tarea Personalizada
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              )}
            </CommandEmpty>
          )}

          {/* Solo mostrar CommandGroup si hay opciones */}
          {options.length > 0 && (
            <CommandGroup className="max-h-48 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="text-xs py-2 px-3 cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Estado vacío cuando no hay búsqueda activa */}
          {options.length === 0 && searchQuery.length < 3 && (
            <div className="py-2 px-3 text-xs text-[var(--input-placeholder)] text-center">
              Escribe al menos 3 caracteres para buscar
            </div>
          )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}