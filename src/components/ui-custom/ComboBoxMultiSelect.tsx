import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface ComboBoxMultiSelectProps {
  options: Array<{
    value: string;
    label: string;
  }>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function ComboBoxMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar opciones...",
  emptyText = "No se encontraron opciones",
  className,
}: ComboBoxMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
    
    // Cerrar el popover después de seleccionar
    setOpen(false);
  };

  const handleRemove = (optionValue: string) => {
    const newValue = value.filter((v) => v !== optionValue);
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (!value || value.length === 0) {
      return placeholder;
    }
    
    return `${value.length} tipo${value.length !== 1 ? 's' : ''} seleccionado${value.length !== 1 ? 's' : ''}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Trigger que se ve como un Input/Select normal */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 data-[placeholder]:text-[var(--input-placeholder)] focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1"
          >
            <span className={cn(
              "truncate text-left",
              (!value || value.length === 0) && "text-[var(--input-placeholder)]"
            )}>
              {getDisplayText()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              )) || []}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Badges debajo del componente */}
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const option = options?.find((opt) => opt.value === v);
            return option ? (
              <Badge
                key={v}
                className="text-xs bg-[var(--accent)] text-white cursor-pointer hover:bg-[var(--accent)]/80 transition-colors flex items-center gap-1"
                onClick={() => handleRemove(v)}
              >
                {option.label}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}