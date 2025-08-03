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
              variant="ghost"
              size="sm"
              onClick={() => onTabChange?.(tab)}
              className={cn(
                "h-8 px-3 text-sm font-medium rounded-full transition-all",
                activeTab === tab
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Lado derecho - Búsqueda, Orden, Filtros (solo iconos) */}
        <div className="flex items-center gap-2">
          {/* Buscador expandible con botón de icono */}
          {showSearch && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "relative transition-all duration-200",
                searchFocused ? "w-64" : "w-48"
              )}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Buscar..."
                  value={searchInputValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    "pl-10 pr-4 h-8 text-sm border-0 bg-[var(--muted)] focus:bg-[var(--background)] transition-all",
                    "placeholder:text-[var(--muted-foreground)]"
                  )}
                />
              </div>
            </div>
          )}

          {/* Botón de ordenamiento (solo icono) */}
          {showSort && renderSortContent && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                {renderSortContent()}
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
                  className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                {renderFilterContent()}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}