import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

interface CustomMultiComboBoxProps {
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

export function CustomMultiComboBox({
  options,
  values,
  onValuesChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron opciones.",
  disabled = false,
  className,
  maxHeight = "max-h-64"
}: CustomMultiComboBoxProps) {
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
      {/* Selected badges */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => handleRemove(option.value)}
            >
              {option.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-xs leading-tight py-2 px-3 h-auto border border-[var(--input-border)] bg-[var(--input-bg)] rounded-md transition-all duration-150 hover:bg-[var(--input-bg)] focus-visible:ring-1 focus-visible:ring-accent",
              selectedOptions.length === 0 && "text-[var(--input-placeholder)]"
            )}
            disabled={disabled}
          >
            {selectedOptions.length > 0 
              ? `${selectedOptions.length} seleccionado${selectedOptions.length > 1 ? 's' : ''}`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className={cn("overflow-auto", maxHeight)}>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
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
    </div>
  );
}