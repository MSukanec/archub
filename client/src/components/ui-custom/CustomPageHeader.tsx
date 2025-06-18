import { LucideIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CustomSearchButton } from "./CustomSearchButton";

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
    <div className="w-full border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:flex-row sm:items-center sm:gap-2 sm:justify-between">
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

        {/* Right side - Icon buttons + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {showSearch && (
            <CustomSearchButton
              value={searchValue}
              onChange={(value) => onSearchChange?.(value)}
            />
          )}

          {showFilters && hasFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                >
                  <Filter className="h-4 w-4" />
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

          {onClearFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFilters}
              className="h-10 w-10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {actions && (
            <div className="flex items-center gap-2 ml-2">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
