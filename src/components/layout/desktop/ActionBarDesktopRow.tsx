import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideIcon } from 'lucide-react';

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
  return (
    <div 
      className="hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg"
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Filtros a la izquierda - Completamente dinámicos */}
        <div className="flex items-center gap-2">
          {filters.filter(filter => filter.enabled !== false).map((filter) => (
            <DropdownMenu key={filter.key}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <filter.icon className="w-4 h-4 mr-1" />
                  {filter.label}
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
          ))}
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