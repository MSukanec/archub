import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"

export type CalendarProps = Omit<React.ComponentProps<typeof DayPicker>, 'onSelect'> & {
  autoClose?: boolean;
  onClose?: () => void;
  onSelect?: any;
}

type ViewMode = 'days' | 'months' | 'years'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
  autoClose = false,
  onClose,
  onSelect,
  ...props
}: CalendarProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('days')
  const [internalMonth, setInternalMonth] = React.useState<Date>(controlledMonth || new Date())
  
  const currentMonth = controlledMonth || internalMonth
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'prev' ? -1 : 1))
    handleMonthChange(newMonth)
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setFullYear(currentMonth.getFullYear() + (direction === 'prev' ? -1 : 1))
    handleMonthChange(newMonth)
  }

  const selectMonth = (monthIndex: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(monthIndex)
    handleMonthChange(newMonth)
    setViewMode('days')
  }

  const selectYear = (year: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setFullYear(year)
    handleMonthChange(newMonth)
    setViewMode('days')
  }

  // Generar rango de años (12 años centrados en el año actual)
  const generateYearRange = () => {
    const startYear = Math.floor(currentYear / 12) * 12
    return Array.from({ length: 12 }, (_, i) => startYear + i)
  }

  const navigateYearGrid = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setFullYear(currentMonth.getFullYear() + (direction === 'prev' ? -12 : 12))
    handleMonthChange(newMonth)
  }

  // Custom Navigation Header
  const CustomNavigationHeader = () => (
    <div className="flex items-center justify-center gap-1 px-2 pb-3 border-b border-border mb-3">
      <button
        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
        onClick={() => navigateYear('prev')}
        type="button"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
        onClick={() => navigateMonth('prev')}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        className="h-7 px-2 text-xs font-medium rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors min-w-[70px]"
        onClick={() => setViewMode('months')}
        type="button"
      >
        {MONTHS_FULL[currentMonthIndex]}
      </button>
      <button
        className="h-7 px-2 text-xs font-medium rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors min-w-[50px]"
        onClick={() => setViewMode('years')}
        type="button"
      >
        {currentYear}
      </button>

      <button
        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
        onClick={() => navigateMonth('next')}
        type="button"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
        onClick={() => navigateYear('next')}
        type="button"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  )

  // Month Selection View
  const MonthSelectionView = () => (
    <div className="p-3 min-h-[280px]">
      <CustomNavigationHeader />
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT.map((month, index) => (
          <button
            key={month}
            className={cn(
              "h-auto py-2 px-3 text-xs font-medium rounded-md border transition-colors",
              index === currentMonthIndex
                ? "bg-accent text-white border-accent"
                : "bg-transparent border-border text-foreground hover:bg-accent/10"
            )}
            onClick={() => selectMonth(index)}
            type="button"
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  )

  // Year Selection View
  const YearSelectionView = () => {
    const years = generateYearRange()
    
    return (
      <div className="p-3 min-h-[280px]">
        <div className="flex items-center justify-between px-2 pb-3 border-b border-border mb-3">
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
            onClick={() => navigateYearGrid('prev')}
            type="button"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <div className="text-sm font-medium">
            {years[0]} - {years[years.length - 1]}
          </div>

          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-accent/10 transition-colors"
            onClick={() => navigateYearGrid('next')}
            type="button"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <button
              key={year}
              className={cn(
                "h-auto py-2 px-3 text-xs font-medium rounded-md border transition-colors",
                year === currentYear
                  ? "bg-accent text-white border-accent"
                  : "bg-transparent border-border text-foreground hover:bg-accent/10"
              )}
              onClick={() => selectYear(year)}
              type="button"
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Interceptar selección de día para autoClose
  const handleDaySelect = React.useCallback((day: any) => {
    if (onSelect && day) {
      // Normalizar a timezone local: crear una fecha sin offset UTC
      // Esto evita que el día seleccionado se corrija por timezone
      const localDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      (onSelect as any)(localDate);
    } else if (onSelect) {
      (onSelect as any)(day);
    }
    if (autoClose && day && onClose) {
      // Pequeño delay para que se vea la selección antes de cerrar
      setTimeout(() => {
        onClose();
      }, 150);
    }
  }, [onSelect, autoClose, onClose]);

  // Days View (normal calendar)
  const DaysView = () => {
    const dayPickerProps = {
      showOutsideDays,
      className: cn("p-0", className),
      month: currentMonth,
      onMonthChange: handleMonthChange,
      ...props,
      onSelect: handleDaySelect,
      classNames: {
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden", // Hide default caption since we use custom header
          caption_label: "text-sm font-medium",
          nav: "hidden", // Hide default navigation
          table: "w-full border-collapse space-y-1",
          head_row: "flex justify-center",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2 justify-center",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-foreground font-medium rounded-md"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "!bg-accent !text-white rounded-md hover:!bg-accent hover:!text-white focus:!bg-accent focus:!text-white font-semibold",
          day_today: "bg-accent text-accent-foreground font-semibold",
          day_outside:
            "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        },
    };
    
    return (
      <div className="min-h-[280px]">
        <CustomNavigationHeader />
        <DayPicker {...(dayPickerProps as any)} />
      </div>
    );
  };

  return (
    <div className={cn("p-3 flex justify-center", className)}>
      <div className="inline-block">
        {viewMode === 'days' && <DaysView />}
        {viewMode === 'months' && <MonthSelectionView />}
        {viewMode === 'years' && <YearSelectionView />}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
