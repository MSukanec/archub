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
    : !searchValue || searchValue.trim() === ''
      ? options // Si NO hay búsqueda, mostrar TODAS las opciones
      : options.filter(option =>
          option && option.label && 
          option.label.toLowerCase().includes(searchValue.toLowerCase())
        ); // Solo filtra cuando SÍ hay búsqueda



  // Check if search value would create a new option
  const searchValueToCheck = onSearchChange ? (searchQuery || '') : (searchValue || '');
  const canCreateNew = allowCreate && searchValueToCheck.trim() && 
    !options.some(option => option && option.label && 
      option.label.toLowerCase() === searchValueToCheck.toLowerCase().trim());

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
            "flex w-full items-center justify-between text-sm md:text-xs leading-tight py-3 md:py-2 px-4 md:px-3 border border-[var(--input-border)] border-gray-300 dark:border-gray-600 bg-[var(--input-bg)] bg-white dark:bg-gray-900 text-foreground text-gray-900 dark:text-gray-100 rounded-md transition-all duration-150 data-[placeholder]:text-[var(--input-placeholder)] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1",
            !selectedOption && "text-[var(--input-placeholder)] text-gray-500 dark:text-gray-400",
            className
          )}
          disabled={disabled}
        >
          <span className="line-clamp-1 text-sm md:text-xs">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 bg-[var(--card-bg)] bg-white dark:bg-gray-900 border-[var(--card-border)] border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-hidden" 
        align="start" 
        style={{ zIndex: 9999 }}
      >
        <Command className="bg-[var(--card-bg)] bg-white dark:bg-gray-900" shouldFilter={false}>
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
            className="text-xs bg-[var(--card-bg)] bg-white dark:bg-gray-900 border-none text-foreground text-gray-900 dark:text-gray-100 placeholder:text-[var(--muted-fg)] placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <CommandList className="max-h-48 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 && !canCreateNew && (
              <CommandEmpty className="text-sm text-[var(--muted-fg)] text-gray-500 dark:text-gray-400 py-3 text-center">{emptyMessage}</CommandEmpty>
            )}
            
            <CommandGroup>
              {filteredOptions.map((option, index) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer text-sm px-3 py-2 hover:bg-muted/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
                >
                  {value === option.value && (
                    <Check className="mr-2 h-3 w-3 flex-shrink-0 text-accent" />
                  )}
                  <span className={cn(
                    "text-foreground text-gray-900 dark:text-gray-100 truncate",
                    value !== option.value && "ml-5" // Add left margin when check is not visible
                  )}>
                    {option.label && option.label.includes(' - ') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-mono">
                          {option.label.split(' - ')[0]}
                        </span>
                        {option.label.split(' - ')[1]}
                      </div>
                    ) : (
                      option.label || ''
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateNew}
                  className="cursor-pointer text-sm px-3 py-2 hover:bg-muted/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-t border-border border-gray-200 dark:border-gray-700"
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