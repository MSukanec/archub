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
        className="p-0 z-[9999] bg-background border" 
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="bg-background rounded-md" shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onSearchChange}
            className="text-xs leading-tight py-2 px-3 border-0 bg-transparent placeholder:text-[var(--input-placeholder)] text-foreground"
          />
          <CommandEmpty className="text-xs py-4 px-3 text-center">
            {showCreateButton && searchQuery.length >= 3 && onCreateTask ? (
              <div className="space-y-3">
                <div className="text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No hay tareas con "{searchQuery}"</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Puede crear una nueva tarea personalizada para su organización
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCreateTask();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Crear Tarea Personalizada
                </button>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm">{emptyText}</p>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
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
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}