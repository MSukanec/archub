import React, { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface ComboBoxMultiRowsOption {
  value: string
  label: string
}

interface ComboBoxMultiRowsProps {
  options: ComboBoxMultiRowsOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function ComboBoxMultiRows({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar opciones...",
  emptyMessage = "No se encontraron opciones",
  className,
  disabled = false,
}: ComboBoxMultiRowsProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      // Remove from selection
      onValueChange(value.filter(v => v !== selectedValue))
    } else {
      // Add to selection
      onValueChange([...value, selectedValue])
    }
  }

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder
    }
    if (value.length === 1) {
      const option = options.find(opt => opt.value === value[0])
      return option?.label || value[0]
    }
    return `${value.length} opciones seleccionadas`
  }

  const isPlaceholder = value.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          disabled={disabled}
        >
          <span className={cn("truncate text-left", isPlaceholder && "text-muted-foreground")}>{getDisplayText()}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
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
        </Command>
        {value.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {value.map((val) => {
                const option = options.find(opt => opt.value === val)
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => handleSelect(val)}
                  >
                    {option?.label || val}
                    <span className="ml-1">×</span>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}