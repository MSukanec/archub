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
  isFilterActive?: boolean;
  showSort?: boolean;
  renderSortContent?: () => ReactNode;
  isSortActive?: boolean;
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
  isFilterActive = false,
  showSort = false,
  renderSortContent,
  isSortActive = false,
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
                "h-8 px-3 text-xs font-normal",
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
            <div 
              className="relative flex items-center"
              onMouseLeave={() => {
                if (isSearchExpanded && !searchFocused) {
                  setIsSearchExpanded(false);
                  setSearchFocused(false);
                }
              }}
            >
              {/* Input expandible con borde */}
              <div className={cn(
                "absolute right-0 transition-all duration-300 overflow-hidden",
                isSearchExpanded ? "w-48 opacity-100" : "w-8 opacity-100"
              )}>
                <div className={cn(
                  "relative flex items-center h-8 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] transition-all",
                  isSearchExpanded ? "bg-[var(--card-bg)]" : "bg-transparent border-transparent"
                )}>
                  <Input
                    placeholder="Buscar..."
                    value={searchInputValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      setSearchFocused(false);
                      setTimeout(() => {
                        if (!searchFocused) {
                          setIsSearchExpanded(false);
                        }
                      }, 150);
                    }}
                    className={cn(
                      "flex-1 h-full text-xs border-0 bg-transparent font-normal",
                      "placeholder:text-[var(--muted-foreground)]",
                      "focus:ring-0 focus:outline-none",
                      isSearchExpanded ? "pl-3 pr-10" : "pl-0 pr-0 opacity-0"
                    )}
                    autoFocus={isSearchExpanded}
                  />
                  
                  {/* Icono dentro del input */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 h-8 w-8 p-0 hover:bg-transparent"
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
                  className={cn(
                    "h-8 w-8 p-0",
                    isSortActive ? "button-secondary-pressed" : ""
                  )}
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
                  className={cn(
                    "h-8 w-8 p-0",
                    isFilterActive ? "button-secondary-pressed" : ""
                  )}
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