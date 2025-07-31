import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideIcon, X } from 'lucide-react';

interface FilterConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  value: string;
  setValue: (value: string) => void;
  options: (string | null)[];
  defaultLabel: string;
  enabled?: boolean;
}

interface ActionConfig {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  enabled?: boolean;
}

interface ActionBarDesktopRowProps {
  // Configuración de filtros - completamente flexible
  filters: FilterConfig[];
  
  // Configuración de acciones - completamente flexible  
  actions: ActionConfig[];
  
  // Opcional: restricciones personalizadas
  customRestricted?: ReactNode;
}

export const ActionBarDesktopRow: React.FC<ActionBarDesktopRowProps> = ({
  filters = [],
  actions = [],
  customRestricted
}) => {
  // Helper function to check if a filter is active (not "all" and not default)
  const isFilterActive = (filter: FilterConfig) => {
    return filter.value !== "all" && filter.value !== "" && filter.value !== filter.defaultLabel;
  };

  // Helper function to get display text for filter
  const getFilterDisplayText = (filter: FilterConfig) => {
    if (isFilterActive(filter)) {
      return `${filter.label}: ${filter.value}`;
    }
    return filter.label;
  };

  return (
    <div 
      className="hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg"
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Filtros a la izquierda - Completamente dinámicos */}
        <div className="flex items-center gap-2">
          {filters.filter(filter => filter.enabled !== false).map((filter) => {
            const isActive = isFilterActive(filter);
            
            return (
              <div key={filter.key} className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 text-xs ${
                        isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : ''
                      }`}
                    >
                      <filter.icon className="w-4 h-4 mr-1" />
                      {getFilterDisplayText(filter)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => filter.setValue("all")}>
                      {filter.defaultLabel}
                    </DropdownMenuItem>
                    {filter.options.filter(Boolean).map((option) => (
                      <DropdownMenuItem key={option} onClick={() => filter.setValue(option!)}>
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Botón X para limpiar filtro activo */}
                {isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() => filter.setValue("all")}
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Acciones a la derecha - Completamente dinámicas */}
        <div className="flex items-center gap-2">
          {customRestricted}
          {actions.filter(action => action.enabled !== false).map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              className="h-8 px-3 text-xs"
            >
              <action.icon className="mr-1 h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};