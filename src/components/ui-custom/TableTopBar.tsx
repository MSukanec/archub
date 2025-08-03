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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
          {/* Buscador expandible */}
          {showSearch && (
            <div className="relative flex items-center">
              {/* Input expandible que aparece detrás del botón */}
              <div className={cn(
                "absolute right-8 transition-all duration-300 overflow-hidden",
                isSearchExpanded ? "w-48 opacity-100" : "w-0 opacity-0"
              )}>
                <Input
                  placeholder="Buscar..."
                  value={searchInputValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onBlur={() => {
                    setIsSearchExpanded(false);
                    setSearchFocused(false);
                  }}
                  className={cn(
                    "h-8 text-sm border-0 bg-[var(--muted)] focus:bg-[var(--background)] transition-all",
                    "placeholder:text-[var(--muted-foreground)]"
                  )}
                  autoFocus={isSearchExpanded}
                />
              </div>
              
              {/* Botón del icono que permanece fijo */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative z-10"
                onClick={() => {
                  setIsSearchExpanded(!isSearchExpanded);
                  if (!isSearchExpanded) {
                    setTimeout(() => setSearchFocused(true), 100);
                  }
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
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
              <PopoverContent className="w-56" align="end">
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
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                {renderFilterContent()}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}