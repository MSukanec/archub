import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SelectableGhostButton, SelectableGhostButtonOption } from '@/components/ui-custom/SelectableGhostButton';
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

interface ActionBarProps {
  // Configuración de filtros - completamente flexible
  filters: FilterConfig[];
  
  // Configuración de acciones - completamente flexible  
  actions: ActionConfig[];
  
  // Opcional: restricciones personalizadas
  customRestricted?: ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({
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
          {filters.filter(filter => filter.enabled !== false).map((filter) => {
            // Convertir las opciones al formato esperado por SelectableGhostButton
            const selectableOptions: SelectableGhostButtonOption[] = filter.options
              .filter(Boolean)
              .map(option => ({
                value: option!,
                label: option!
              }));

            return (
              <SelectableGhostButton
                key={filter.key}
                title={filter.label}
                defaultLabel={filter.defaultLabel}
                selectedValue={filter.value}
                options={selectableOptions}
                onSelect={(value) => {
                  // Si no hay valor seleccionado, usar string vacío
                  filter.setValue(value || "");
                }}
                icon={<filter.icon className="w-4 h-4" />}
                placeholder={filter.defaultLabel}
              />
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
              {action.icon && <action.icon className="mr-1 h-3 w-3" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};