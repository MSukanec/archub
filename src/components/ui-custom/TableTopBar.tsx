import React, { useState, ReactNode } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TableTopBarProps {
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (newTab: string) => void;
  showSearch?: boolean;
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  showFilter?: boolean;
  renderFilterContent?: () => ReactNode;
  showSort?: boolean;
  renderSortContent?: () => ReactNode;
}

export function TableTopBar({
  tabs = [],
  activeTab,
  onTabChange,
  showSearch = false,
  onSearchChange,
  searchValue = "",
  showFilter = false,
  renderFilterContent,
  showSort = false,
  renderSortContent,
}: TableTopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(searchValue);

  // No renderizar nada si no hay configuración
  const hasContent = tabs.length > 0 || showSearch || showFilter || showSort;

  if (!hasContent) return null;

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    onSearchChange?.(value);
  };

  return (
    <div className="hidden lg:block border-b border-[var(--card-border)] bg-[var(--card-bg)]">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Lado izquierdo - Tabs (solo texto) */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTabChange?.(tab)}
              className={cn(
                "h-8 px-3 text-base font-normal",
                activeTab === tab ? "button-secondary-pressed" : ""
              )}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Lado derecho - Búsqueda, Orden, Filtros (solo iconos) */}
        <div className="flex items-center gap-1">
          {/* Botón de búsqueda (solo icono) */}
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                // Aquí se podría abrir un modal de búsqueda o focus en un input existente
                console.log('Search clicked');
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Botón de ordenamiento (solo icono) */}
          {showSort && renderSortContent && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">Ordenar por:</h4>
                  {renderSortContent()}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Botón de filtros (solo icono) */}
          {showFilter && renderFilterContent && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">Filtrar por:</h4>
                  {renderFilterContent()}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}