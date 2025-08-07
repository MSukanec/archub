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
      style={{ backgroundColor: "var(--card-bg)" }}
    >
        {/* Filtros a la izquierda - Completamente dinámicos */}
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
                placeholder={filter.defaultLabel}
              />
            );
          })}
        </div>

        {/* Acciones a la derecha - Completamente dinámicas */}
          {customRestricted}
          {actions.filter(action => action.enabled !== false).map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};