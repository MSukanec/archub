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
  onSearchChange?: (value: string) => void;
  searchQuery?: string;
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
  createIcon,
  onSearchChange,
  searchQuery = ""
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search
  const filteredOptions = onSearchChange 
    ? options // Si hay búsqueda externa, mostrar todas las opciones que vienen del hook
    : options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      );



  // Check if search value would create a new option
  const searchValueToCheck = onSearchChange ? searchQuery : searchValue;
  const canCreateNew = allowCreate && searchValueToCheck.trim() && 
    !options.some(option => option.label.toLowerCase() === searchValueToCheck.toLowerCase().trim());

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    if (!onSearchChange) {
      setSearchValue('');
    }
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
            "flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 data-[placeholder]:text-[var(--input-placeholder)] focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1",
            !selectedOption && "text-[var(--input-placeholder)]",
            className
          )}
          disabled={disabled}
        >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        style={{ zIndex: 9999 }}
      >
          <CommandInput 
            placeholder={searchPlaceholder}
            value={onSearchChange ? searchQuery : searchValue}
            onValueChange={(value) => {
              if (onSearchChange) {
                onSearchChange(value);
              } else {
                setSearchValue(value);
              }
            }}
          />
            {filteredOptions.length === 0 && !canCreateNew && (
            )}
            
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === option.value ? "opacity-100 text-accent" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateNew}
                  disabled={isCreating}
                >
                    {isCreating 
                      ? `Creando "${searchValue.trim()}"...`
                      : createLabel(searchValue.trim())
                    }
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}