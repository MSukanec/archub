import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
interface ComboBoxOption {
  value: string;
  label: string;
  [key: string]: any; // Allow additional fields for custom rendering
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
  renderOption?: (option: ComboBoxOption, isSelected: boolean) => React.ReactNode;
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
  searchQuery = "",
  renderOption
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
            "flex w-full items-center justify-between text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--card-fg)] rounded-md transition-all duration-150 data-[placeholder]:text-[var(--input-placeholder)] focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1",
            !selectedOption && "text-[var(--input-placeholder)]",
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
        className="w-[--radix-popover-trigger-width] p-0 z-[10000] border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--card-fg)] rounded-md shadow-lg max-h-60 overflow-hidden" 
        align="start"
        avoidCollisions={true}
        collisionPadding={10}
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
            className="text-xs bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--card-fg)] placeholder:text-[var(--input-placeholder)]"
          />
          <CommandList className="max-h-48 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 && !canCreateNew && (
              <CommandEmpty className="text-sm text-[var(--card-fg)] py-3 text-center">{emptyMessage}</CommandEmpty>
            )}
            
            <CommandGroup>
              {filteredOptions.map((option, index) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer text-sm px-3 py-2 transition-colors hover:bg-muted focus:bg-muted flex items-center"
                >
                  {value === option.value && (
                    <Check className="mr-2 h-3 w-3 flex-shrink-0" style={{ color: 'var(--accent)'}} />
                  )}
                  <div className={cn(
                    "flex-1 text-[var(--card-fg)]",
                    value !== option.value && "ml-5" // Add left margin when check is not visible
                  )}>
                    {renderOption ? (
                      renderOption(option, value === option.value)
                    ) : option.label && option.label.includes('- ') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">
                          {option.label.split('- ')[0]}
                        </span>
                        {option.label.split('- ')[1]}
                      </div>
                    ) : (
                      option.label || ''
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateNew}
                  className="cursor-pointer text-sm px-3 py-2 transition-colors hover:bg-muted focus:bg-muted border-t border-[var(--card-border)]"
                  disabled={isCreating}
                >
                  {createIcon && <span className="mr-2" style={{ color: 'var(--accent)'}}>{createIcon}</span>}
                  <span className="font-medium" style={{ color: 'var(--accent)'}}>
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