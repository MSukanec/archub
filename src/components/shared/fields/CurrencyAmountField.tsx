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

interface CurrencyAmountFieldProps {
  value?: number
  currency?: string
  currencies: Currency[]
  onValueChange?: (value: number | undefined) => void
  onCurrencyChange?: (currency: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const CurrencyAmountField = React.forwardRef<HTMLInputElement, CurrencyAmountFieldProps>(
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
      
      // Limpiar el string y manejar tanto comas como puntos como decimales
      let cleanStr = str.replace(/[^0-9.,]/g, '')
      
      // Si contiene tanto puntos como comas, asumir formato europeo: 1.234,56
      if (cleanStr.includes('.') && cleanStr.includes(',')) {
        // Encontrar la última coma o punto (será el separador decimal)
        const lastCommaIndex = cleanStr.lastIndexOf(',')
        const lastDotIndex = cleanStr.lastIndexOf('.')
        
        if (lastCommaIndex > lastDotIndex) {
          // La coma es el separador decimal: 1.234,56 -> 1234.56
          cleanStr = cleanStr.slice(0, lastCommaIndex).replace(/[.,]/g, '') + '.' + cleanStr.slice(lastCommaIndex + 1)
        } else {
          // El punto es el separador decimal: 1,234.56 -> 1234.56
          cleanStr = cleanStr.slice(0, lastDotIndex).replace(/[.,]/g, '') + '.' + cleanStr.slice(lastDotIndex + 1)
        }
      } else if (cleanStr.includes(',')) {
        // Solo comas: puede ser separador de miles (1,234) o decimal (25570,3)
        const commaIndex = cleanStr.lastIndexOf(',')
        const afterComma = cleanStr.slice(commaIndex + 1)
        
        // Si después de la coma hay 1 o 2 dígitos, es decimal
        if (afterComma.length <= 2 && afterComma.length > 0) {
          cleanStr = cleanStr.replace(/,/g, '.')
        } else {
          // Es separador de miles, remover comas
          cleanStr = cleanStr.replace(/,/g, '')
        }
      } else if (cleanStr.includes('.')) {
        // Solo puntos: puede ser separador de miles (1.234) o decimal (25570.3)
        const dotIndex = cleanStr.lastIndexOf('.')
        const afterDot = cleanStr.slice(dotIndex + 1)
        
        // Si después del punto hay más de 2 dígitos, probablemente sea separador de miles
        if (afterDot.length > 2) {
          cleanStr = cleanStr.replace(/\./g, '')
        }
        // Si hay 1-2 dígitos después del punto, mantener como decimal
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
                "flex w-[90px] md:w-[80px] text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-l-md transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
                "border-r-0 justify-between items-center",
                "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1",
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
            "flex w-full text-sm md:text-xs leading-tight py-2.5 md:py-2 px-3 md:px-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-r-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed",
            "border-l-0 rounded-l-none text-right",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1"
          )}
        />
      </div>
    )
  }
)

CurrencyAmountField.displayName = 'CurrencyAmountField'