import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

interface TaskSearchComboProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  onSearchChange?: (search: string) => void;
  showCreateButton?: boolean;
  onCreateTask?: () => void;
  searchQuery?: string;
}

export function TaskSearchCombo({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones.",
  disabled = false,
  className,
  onSearchChange,
  showCreateButton = false,
  onCreateTask,
  searchQuery = ""
}: TaskSearchComboProps) {
  const [open, setOpen] = useState(false);



  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            // Styled EXACTLY like Input component from ui/input.tsx
            "flex w-full text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
            "justify-between items-center cursor-pointer",
            !selectedOption && "text-[var(--input-placeholder)]",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 z-[9999] bg-background border w-full" 
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="bg-background rounded-md" shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onSearchChange}
            className="text-xs h-8 border-0 bg-transparent placeholder:text-[var(--input-placeholder)] text-foreground"
          />
          
          {/* Solo mostrar CommandEmpty si no hay opciones Y hay una búsqueda activa */}
          {options.length === 0 && searchQuery.length >= 3 && (
            <CommandEmpty className="text-xs py-3 px-3 text-center">
              {showCreateButton && onCreateTask ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No hay tareas con "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onCreateTask();
                    }}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Tarea Personalizada
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              )}
            </CommandEmpty>
          )}

          {/* Solo mostrar CommandGroup si hay opciones */}
          {options.length > 0 && (
            <CommandGroup className="max-h-48 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="text-xs py-2 px-3 cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Estado vacío cuando no hay búsqueda activa */}
          {options.length === 0 && searchQuery.length < 3 && (
            <div className="py-2 px-3 text-xs text-muted-foreground text-center">
              Escribe al menos 3 caracteres para buscar
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}