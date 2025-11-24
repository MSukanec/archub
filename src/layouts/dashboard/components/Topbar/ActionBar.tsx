import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';

interface ActionBarProps {
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
}

export function ActionBar({
  selectedValue,
  onValueChange,
  onEdit,
  onDelete,
  placeholder = "Seleccionar...",
  options = [],
  disabled = false
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b bg-background/50 backdrop-blur-sm">
      <div className="flex-1">
        <ComboBox
          value={selectedValue}
          onValueChange={onValueChange}
          placeholder={placeholder}
          options={options}
          disabled={disabled}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={!selectedValue || disabled}
          className="h-8 px-3"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!selectedValue || disabled}
          className="h-8 px-3 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}