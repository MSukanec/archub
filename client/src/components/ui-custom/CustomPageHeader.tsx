import { LucideIcon, Search, Filter, X, ArrowUpDown } from "lucide-react";
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
    <div className="h-[38px] border-2 border-orange-500 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      {/* Left side - Icon and Title */}
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
      
      {/* Right side - All controls in order */}
      <div className="flex items-center gap-2">
        {/* 1. Filters dropdown */}
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

        {/* 2. Clear filters */}
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

        {/* 3. Sort button */}
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <ArrowUpDown style={{ width: "16px", height: "16px" }} />
          <span className="text-sm">Sort</span>
        </Button>

        {/* 4. Secondary buttons (if any) */}
        {/* 5. Primary button (actions) */}
        {actions && (
          <>
            {actions}
          </>
        )}
      </div>
    </div>
  );
}