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
            {selectedOption ? (
              <>
                {selectedOption.code && (
                    {selectedOption.code}
                  </Badge>
                )}
              </>
            ) : (
              placeholder
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="start"
        style={{ zIndex: 99999 }}
      >
          <CommandInput 
            placeholder={searchPlaceholder} 
          />
            {emptyMessage}
          </CommandEmpty>
            {allowClear && (
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
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
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    option.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                  {option.code && (
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