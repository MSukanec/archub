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
            "flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
            !selectedOption && "text-[var(--input-placeholder)]",
            className
          )}
          disabled={disabled}
        >
          <div className="flex-1 min-w-0 text-left max-h-[2.5rem] overflow-hidden">
            <span className="block text-sm leading-tight overflow-hidden text-ellipsis" style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical' 
            }}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 bg-[var(--card-bg)] border-[var(--card-border)] shadow-lg max-h-60 overflow-hidden" 
        align="start" 
        style={{ zIndex: 9999 }}
      >
        <Command className="bg-[var(--card-bg)]" shouldFilter={false}>
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
            className="text-sm bg-[var(--card-bg)] border-none text-foreground placeholder:text-muted-foreground"
          />
          <CommandList className="max-h-48 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 && !canCreateNew && (
              <CommandEmpty className="text-sm text-muted-foreground py-3 text-center">{emptyMessage}</CommandEmpty>
            )}
            
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer text-sm px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === option.value ? "opacity-100 text-accent" : "opacity-0"
                    )}
                  />
                  <span className="text-foreground truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateNew}
                  className="cursor-pointer text-sm px-3 py-2 hover:bg-muted/50 transition-colors border-t border-border"
                  disabled={isCreating}
                >
                  {createIcon && <span className="mr-2 text-accent">{createIcon}</span>}
                  <span className="text-accent font-medium">
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