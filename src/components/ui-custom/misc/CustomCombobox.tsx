import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboboxOption {
  id: string;
  name: string;
  code?: string;
}

interface CustomComboboxProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomCombobox({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron opciones.",
  allowClear = false,
  clearLabel = "Sin selección",
  className,
  disabled = false
}: CustomComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = value ? options.find(option => option.id === value) : null;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 hover:bg-[var(--input-bg)] focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
            !value && "text-[var(--input-placeholder)]",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedOption ? (
              <>
                <span className="truncate">{selectedOption.name}</span>
                {selectedOption.code && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                    {selectedOption.code}
                  </Badge>
                )}
              </>
            ) : (
              placeholder
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999] bg-[var(--popover-bg)] border border-[var(--card-border)]" 
        align="start"
      >
        <Command className="bg-[var(--popover-bg)]">
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="text-xs border-none focus:ring-0"
          />
          <CommandEmpty className="text-xs text-[var(--input-placeholder)] py-2 px-3">
            {emptyMessage}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto p-1">
            {allowClear && (
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
                className="text-xs py-2 px-2 rounded-sm hover:bg-[var(--card-hover-bg)] cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                {clearLabel}
              </CommandItem>
            )}
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  onValueChange(option.id);
                  setOpen(false);
                }}
                className="text-xs py-2 px-2 rounded-sm hover:bg-[var(--card-hover-bg)] cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    option.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate">{option.name}</span>
                  {option.code && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                      {option.code}
                    </Badge>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}