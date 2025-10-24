import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
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
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (disableFuture && date > today) return true
    if (disablePast && date < today) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={isDateDisabled}
          initialFocus
          locale={es}
          classNames={{
            day_selected:
              "bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:text-white focus:bg-[var(--accent)] focus:text-white",
            day_today: "bg-accent/10 text-accent-foreground font-semibold",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
