import { LucideIcon, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomPageHeaderProps {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[];
  onClearFilters?: () => void;
}

export function CustomPageHeader({
  icon: Icon,
  title,
  actions,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [],
  onClearFilters,
}: CustomPageHeaderProps) {
  const hasFilters = filters.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 border-2 border-green-500">
      {/* Primera fila: Título + Acciones */}
      <div 
        className="flex items-center justify-between px-6"
        style={{ height: "38px" }}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon 
              className="text-slate-600 dark:text-slate-400"
              style={{ width: "18px", height: "18px" }}
            />
          )}
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Segunda fila: Búsqueda + Filtros */}
      <div 
        className="flex items-center gap-3 px-6"
        style={{ height: "38px" }}
      >
        {/* Input de búsqueda */}
        {showSearch && (
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              style={{ width: "16px", height: "16px" }}
            />
            <Input
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>
        )}

        {/* Botón Filtros */}
        {showFilters && hasFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter style={{ width: "16px", height: "16px" }} />
                <span className="text-sm">Filtros</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {filters.map((filter, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={filter.onClick}
                  className="text-sm"
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Botón Limpiar filtros */}
        {onClearFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <X style={{ width: "16px", height: "16px" }} />
            <span className="text-sm">Limpiar</span>
          </Button>
        )}
      </div>
    </div>
  );
}