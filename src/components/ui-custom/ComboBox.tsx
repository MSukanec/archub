import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ComboBoxOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: ComboBoxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateNew?: (value: string) => Promise<ComboBoxOption>;
  createLabel?: (value: string) => string;
  createIcon?: React.ReactNode;
}

export function ComboBox({
  value,
  onValueChange,
  options = [],
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron opciones.",
  className,
  disabled = false,
  allowCreate = false,
  onCreateNew,
  createLabel = (value) => `Crear "${value}"`,
  createIcon
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search value would create a new option
  const canCreateNew = allowCreate && searchValue.trim() && 
    !options.some(option => option.label.toLowerCase() === searchValue.toLowerCase().trim());

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateNew = async () => {
    if (!searchValue.trim() || !onCreateNew) return;

    setIsCreating(true);
    try {
      const newOption = await onCreateNew(searchValue.trim());
      onValueChange(newOption.value);
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Error creating new option:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
            !selectedOption && "text-[var(--input-placeholder)]",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" style={{ zIndex: 9999 }}>
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && !canCreateNew && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateNew}
                  className="cursor-pointer"
                  disabled={isCreating}
                >
                  {createIcon && <span className="mr-2">{createIcon}</span>}
                  {isCreating 
                    ? `Creando "${searchValue.trim()}"...`
                    : createLabel(searchValue.trim())
                  }
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}