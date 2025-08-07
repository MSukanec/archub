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
      {/* Filtros a la izquierda */}
      {onFiltersChange && filterOptions && (
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                // Usar EXACTAMENTE las mismas clases que el input de búsqueda
                "flex items-center justify-center text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
                "w-auto h-auto", // Permitir que se ajuste al contenido como el input
                activeFiltersCount > 0 && "bg-accent text-accent-foreground"
              )}
            >
              {activeFiltersCount > 0 && (
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({ origin: 'all' })}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              
              {/* Filtro por Origen */}
                <Select
                  value={filters.origin || "all"}
                  onValueChange={(value: 'all' | 'system' | 'organization') => 
                    onFiltersChange({ ...filters, origin: value })
                  }
                >
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
                <Select
                  value={filters.subcategory || ""}
                  onValueChange={(value) => 
                    onFiltersChange({ ...filters, subcategory: value || undefined })
                  }
                  disabled={!filters.category}
                >
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
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
                <CommandInput 
                  placeholder={searchPlaceholder} 
                  onValueChange={onSearchChange}
                  value={searchQuery}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onSearchChange) {
                        onSearchChange('');
                      }
                    }}
                  >
                  </Button>
                )}
              </div>
          
          {/* Solo mostrar CommandEmpty si no hay opciones Y hay una búsqueda activa */}
          {options.length === 0 && searchQuery.length >= 3 && (
              {showCreateButton && onCreateTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onCreateTask();
                    }}
                  >
                    Crear Tarea Personalizada
                  </button>
                </div>
              ) : (
              )}
            </CommandEmpty>
          )}

          {/* Solo mostrar CommandGroup si hay opciones */}
          {options.length > 0 && (
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Estado vacío cuando no hay búsqueda activa */}
          {options.length === 0 && searchQuery.length < 3 && (
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