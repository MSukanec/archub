import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

type ViewMode = 'days' | 'months' | 'years'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
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
    <div className="flex items-center justify-between px-2 pb-3 border-b border-border mb-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateYear('prev')}
          type="button"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('prev')}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-7 px-3 text-xs font-medium"
          onClick={() => setViewMode('months')}
          type="button"
        >
          {MONTHS_FULL[currentMonthIndex]}
        </Button>
        <Button
          variant="outline"
          className="h-7 px-3 text-xs font-medium"
          onClick={() => setViewMode('years')}
          type="button"
        >
          {currentYear}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('next')}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateYear('next')}
          type="button"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Month Selection View
  const MonthSelectionView = () => (
    <div className="p-3">
      <CustomNavigationHeader />
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT.map((month, index) => (
          <Button
            key={month}
            variant={index === currentMonthIndex ? "default" : "outline"}
            className="h-9 text-xs"
            onClick={() => selectMonth(index)}
            type="button"
          >
            {month}
          </Button>
        ))}
      </div>
    </div>
  )

  // Year Selection View
  const YearSelectionView = () => {
    const years = generateYearRange()
    
    return (
      <div className="p-3">
        <div className="flex items-center justify-between px-2 pb-3 border-b border-border mb-3">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigateYearGrid('prev')}
            type="button"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {years[0]} - {years[years.length - 1]}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigateYearGrid('next')}
            type="button"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === currentYear ? "default" : "outline"}
              className="h-9 text-xs"
              onClick={() => selectYear(year)}
              type="button"
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Days View (normal calendar)
  const DaysView = () => (
    <div>
      <CustomNavigationHeader />
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-0", className)}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden", // Hide default caption since we use custom header
          caption_label: "text-sm font-medium",
          nav: "hidden", // Hide default navigation
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-foreground font-medium rounded-md"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "!bg-transparent !text-foreground border-[3px] [border-color:var(--accent)] rounded-md hover:!bg-transparent hover:!text-foreground focus:!bg-transparent focus:!text-foreground font-semibold",
          day_today: "bg-accent text-accent-foreground font-semibold",
          day_outside:
            "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  )

  return (
    <div className={cn("p-3", className)}>
      {viewMode === 'days' && <DaysView />}
      {viewMode === 'months' && <MonthSelectionView />}
      {viewMode === 'years' && <YearSelectionView />}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
