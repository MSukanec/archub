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
    const [inputValue, setInputValue] = React.useState(value?.toString() || '')

    const selectedCurrency = currencies.find(c => c.id === currency)

    React.useEffect(() => {
      setInputValue(value?.toString() || '')
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      setInputValue(inputVal)
      
      // Parse the number
      const numericValue = inputVal === '' ? undefined : parseFloat(inputVal)
      if (onValueChange) {
        onValueChange(numericValue)
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
        {/* Currency Selector Button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={disabled}
              className={cn(
                "w-24 justify-between rounded-r-none border-r-0 bg-muted/50",
                !selectedCurrency && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selectedCurrency ? selectedCurrency.symbol : "---"}
              </span>
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
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

        {/* Amount Input */}
        <Input
          {...props}
          ref={ref}
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-l-none flex-1"
        />
      </div>
    )
  }
)

AmountInput.displayName = 'AmountInput'