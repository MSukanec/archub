import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { cn } from '@/lib/utils';

interface ComboBoxMultiRowsProps {
  options: Array<{
    value: string;
    label: string;
  }>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  addButtonText?: string;
  className?: string;
}

export function ComboBoxMultiRows({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opción...",
  addButtonText = "Agregar",
  className,
}: ComboBoxMultiRowsProps) {
  const [newValue, setNewValue] = useState<string>('');
  const { openModal } = useGlobalModalStore();

  // Get available options (excluding already selected ones)
  const availableOptions = options.filter(option => !value.includes(option.value));

  const handleAdd = () => {
    if (newValue && !value.includes(newValue)) {
      onChange([...value, newValue]);
      setNewValue('');
    }
  };

  const handleRemove = (valueToRemove: string) => {
    const optionToRemove = options.find(opt => opt.value === valueToRemove);
    
    openModal('delete-confirmation', {
      title: "Eliminar elemento",
      description: `¿Estás seguro de que deseas eliminar "${optionToRemove?.label}"?`,
      itemName: optionToRemove?.label || '',
      mode: 'dangerous',
      onConfirm: () => {
        onChange(value.filter(v => v !== valueToRemove));
      }
    });
  };

  const getOptionLabel = (optionValue: string) => {
    return options.find(opt => opt.value === optionValue)?.label || optionValue;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected items */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((selectedValue) => (
            <div
              key={selectedValue}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]"
            >
              <span className="text-sm font-medium">
                {getOptionLabel(selectedValue)}
              </span>
              <Button
                variant="ghost-icon"
                onClick={() => handleRemove(selectedValue)}
                className="text-destructive hover:text-destructive h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      {availableOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select value={newValue} onValueChange={setNewValue}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={!newValue}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      )}

      {/* No more options available */}
      {availableOptions.length === 0 && value.length < options.length && (
        <p className="text-sm text-muted-foreground">
          Todas las opciones disponibles han sido seleccionadas.
        </p>
      )}
    </div>
  );
}