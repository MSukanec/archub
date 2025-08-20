import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Currency {
  id: string
  name: string
  symbol: string
}

interface AmountInputProps {
  value?: number
  currency?: string
  currencies: Currency[]
  onValueChange?: (value: number | undefined) => void
  onCurrencyChange?: (currency: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ 
    value, 
    currency, 
    currencies, 
    onValueChange, 
    onCurrencyChange, 
    placeholder = "0.00", 
    className,
    disabled = false,
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const [isEditing, setIsEditing] = React.useState(false)

    const selectedCurrency = currencies.find(c => c.id === currency)

    // Formatear número con separador de miles
    const formatNumber = (num: number): string => {
      return num.toLocaleString('es-AR', { maximumFractionDigits: 2, useGrouping: true })
        .replace(/,/g, '.') // Usar punto como separador de miles
        .replace(/\.(\d{2})$/, ',$1') // Usar coma para decimales
    }

    // Extraer número limpio del string formateado
    const parseFormattedNumber = (str: string): number | undefined => {
      if (!str) return undefined
      // Remover todo excepto números y la última coma (decimales)
      const lastComma = str.lastIndexOf(',')
      let cleanStr = str.replace(/[^0-9,]/g, '')
      
      if (lastComma !== -1 && lastComma === cleanStr.lastIndexOf(',')) {
        // Hay decimales, convertir la coma final a punto
        cleanStr = cleanStr.replace(/,/g, '').slice(0, -2) + '.' + cleanStr.slice(-2)
      } else {
        // Sin decimales, remover todas las comas
        cleanStr = cleanStr.replace(/,/g, '')
      }
      
      const num = parseFloat(cleanStr)
      return isNaN(num) ? undefined : num
    }

    // Actualizar valor mostrado cuando cambia el valor externo
    React.useEffect(() => {
      if (!isEditing) {
        if (value !== undefined && value !== null) {
          setInputValue(formatNumber(value))
        } else {
          setInputValue('')
        }
      }
    }, [value, isEditing])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      setInputValue(inputVal)
      
      // Solo permitir números, puntos y comas
      const sanitized = inputVal.replace(/[^0-9.,]/g, '')
      if (sanitized !== inputVal) {
        setInputValue(sanitized)
        return
      }
      
      // Parse the number
      const numericValue = parseFormattedNumber(sanitized)
      if (onValueChange) {
        onValueChange(numericValue)
      }
    }

    const handleFocus = () => {
      setIsEditing(true)
      // Al hacer foco, mostrar el número sin formateo para fácil edición
      if (value !== undefined && value !== null) {
        setInputValue(value.toString())
      }
    }

    const handleBlur = () => {
      setIsEditing(false)
      // Al perder foco, aplicar el formateo
      if (value !== undefined && value !== null) {
        setInputValue(formatNumber(value))
      }
    }

    const handleCurrencySelect = (currencyId: string) => {
      if (onCurrencyChange) {
        onCurrencyChange(currencyId)
      }
      setOpen(false)
    }

    return (
      <div className={cn("flex", className)}>
        {/* Currency Selector Button - EXACTAMENTE IDÉNTICO al Input */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "flex w-[80px] text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-l-md transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
                "border-r-0 justify-between items-center",
                !selectedCurrency && "text-[var(--input-placeholder)]"
              )}
            >
              <span className="truncate font-mono text-xs">
                {selectedCurrency ? selectedCurrency.symbol : "$"}
              </span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar moneda..." />
              <CommandList>
                <CommandEmpty>No se encontraron monedas.</CommandEmpty>
                <CommandGroup>
                  {currencies.map((curr) => (
                    <CommandItem
                      key={curr.id}
                      value={curr.name}
                      onSelect={() => handleCurrencySelect(curr.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {curr.symbol}
                          </span>
                          <span>{curr.name}</span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            currency === curr.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Amount Input - EXACTAMENTE IDÉNTICO al Input */}
        <input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-r-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
            "border-l-0 rounded-l-none"
          )}
        />
      </div>
    )
  }
)

AmountInput.displayName = 'AmountInput'