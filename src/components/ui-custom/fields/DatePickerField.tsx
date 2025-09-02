import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerFieldProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disableFuture?: boolean
  disablePast?: boolean
  minDate?: Date
  maxDate?: Date
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = "",
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const isDateDisabled = (date: Date) => {
    if (disableFuture && date > new Date()) return true
    if (disablePast && date < new Date()) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            // Exact SelectTrigger styles matching SELECT and INPUT components
            "flex w-full items-center justify-between text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
            // Validation error styling
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1",
            // Placeholder text styling
            !value && "text-[var(--input-placeholder)]",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
        >
          <span className="truncate">
            {value ? format(value, "dd/MM/yyyy", { locale: es }) : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 text-foreground opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}