import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (disableFuture && date > today) return true
    if (disablePast && date < today) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Crear una nueva fecha en timezone local usando los componentes de fecha
      // Esto evita problemas de conversión UTC
      const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, // Hora fija a mediodía para evitar problemas de DST
        0,
        0,
        0
      )
      onChange(localDate)
    } else {
      // Permitir limpiar la fecha seleccionada
      onChange(undefined)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-start text-left text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
            !value && "text-[var(--input-placeholder)]",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {value ? format(value, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          disabled={isDateDisabled}
          initialFocus
          locale={es}
          captionLayout="dropdown-buttons"
          fromYear={1920}
          toYear={new Date().getFullYear()}
          classNames={{
            day_selected:
              "border-2 [border-color:var(--accent)] bg-transparent text-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground font-semibold",
            day_today: "font-semibold [background:var(--accent)] [color:var(--accent-foreground)] hover:[background:var(--accent)] hover:[color:var(--accent-foreground)]",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
