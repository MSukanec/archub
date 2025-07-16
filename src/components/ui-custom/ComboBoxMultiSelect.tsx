import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

interface ComboBoxMultiSelectProps {
  options: Option[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
}

export function ComboBoxMultiSelect({
  options,
  values,
  onValuesChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones.",
  disabled = false,
  className,
  maxHeight = "max-h-64"
}: ComboBoxMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Safety checks to prevent undefined errors
  const safeOptions = options || [];
  const safeValues = values || [];

  const selectedOptions = safeOptions.filter(option => safeValues.includes(option.value));
  const availableOptions = safeOptions.filter(option => !safeValues.includes(option.value));

  const handleSelect = (optionValue: string) => {
    if (safeValues.includes(optionValue)) {
      onValuesChange(safeValues.filter(v => v !== optionValue));
    } else {
      onValuesChange([...safeValues, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onValuesChange(safeValues.filter(v => v !== optionValue));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Combobox selector - matching Select trigger exactly */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 data-[placeholder]:text-[var(--input-placeholder)] focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1",
              selectedOptions.length === 0 && "text-[var(--input-placeholder)]"
            )}
            disabled={disabled}
          >
            <span className="block truncate">
              {selectedOptions.length > 0 
                ? `${selectedOptions.length} seleccionado${selectedOptions.length > 1 ? 's' : ''}`
                : placeholder
              }
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
            <CommandEmpty className="py-6 text-center text-sm">{emptyText}</CommandEmpty>
            <CommandGroup className={cn("overflow-auto", maxHeight)}>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected badges - below the selector */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              className="cursor-pointer bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => handleRemove(option.value)}
            >
              {option.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}