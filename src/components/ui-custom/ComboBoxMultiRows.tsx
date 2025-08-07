import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite';
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
  const [showComboBox, setShowComboBox] = useState(false);
  const [newValue, setNewValue] = useState<string>('');
  const { openModal } = useGlobalModalStore();

  // Get available options (excluding already selected ones)
  const availableOptions = options.filter(option => !value.includes(option.value));

  const handleAdd = (selectedValue: string) => {
    if (selectedValue && !value.includes(selectedValue)) {
      onChange([...value, selectedValue]);
      setNewValue('');
      setShowComboBox(false);
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

  const showAddButton = availableOptions.length > 0 && (!showComboBox || value.length === 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected items */}
      {value.length > 0 && (
          {value.map((selectedValue) => (
            <div
              key={selectedValue}
            >
                {getOptionLabel(selectedValue)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(selectedValue)}
              >
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ComboBox for adding new item */}
      {showComboBox && availableOptions.length > 0 && (
          <ComboBox
            options={availableOptions}
            value={newValue}
            onValueChange={(selectedValue) => {
              setNewValue(selectedValue);
              handleAdd(selectedValue);
            }}
            placeholder={placeholder}
            searchPlaceholder="Buscar opciones..."
          />
        </div>
      )}

      {/* Add button */}
      {showAddButton && (
        <Button
          variant="default"
          onClick={() => setShowComboBox(true)}
        >
          {addButtonText}
        </Button>
      )}

      {/* No more options available */}
      {availableOptions.length === 0 && value.length < options.length && (
          Todas las opciones disponibles han sido seleccionadas.
        </p>
      )}
    </div>
  );
}