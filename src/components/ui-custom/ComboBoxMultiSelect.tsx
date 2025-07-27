import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  maxDisplay?: number;
  className?: string;
}

export function ComboBoxMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar opciones...",
  maxDisplay = 3,
  className,
}: ComboBoxMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder;
    }
    
    if (value.length <= maxDisplay) {
      return value
        .map((v) => options.find((opt) => opt.value === v)?.label)
        .filter(Boolean)
        .join(", ");
    }
    
    return `${value.length} opciones seleccionadas`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between text-left", className)}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No se encontraron opciones.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {value.length > 0 && (
            <div className="border-t p-2">
              <div className="flex flex-wrap gap-1">
                {value.slice(0, maxDisplay).map((v) => {
                  const option = options.find((opt) => opt.value === v);
                  return option ? (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="text-xs"
                    >
                      {option.label}
                    </Badge>
                  ) : null;
                })}
                {value.length > maxDisplay && (
                  <Badge variant="outline" className="text-xs">
                    +{value.length - maxDisplay} más
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}