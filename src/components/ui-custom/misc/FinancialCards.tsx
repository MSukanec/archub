import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMobile } from '@/hooks/use-mobile'

interface CurrencyBalance {
  currency: string
  income: number
  expense: number
  balance: number
}

interface FinancialCardsProps {
  balances: CurrencyBalance[]
  defaultCurrency?: string
}

export const FinancialCards = ({ balances, defaultCurrency }: FinancialCardsProps) => {
  const isMobile = useMobile()
  
  // State for mobile currency selection
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Default to organization's default currency or first available
    return defaultCurrency || balances[0]?.currency || ''
  })

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount)
  }

  const renderCard = (balance: CurrencyBalance, showCurrencySelector = false) => (
    <Card key={balance.currency} className="bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--card-fg)] flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {balance.currency}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Currency Selector for Mobile - inside card */}
          {showCurrencySelector && (
            <div className="mb-3 pb-2 border-b border-[var(--card-border)]">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((balance) => (
                    <SelectItem key={balance.currency} value={balance.currency}>
                      {balance.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--muted-fg)]">Ingresos:</span>
            <span className="text-xs font-medium text-green-600">
              +${formatAmount(balance.income)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--muted-fg)]">Egresos:</span>
            <span className="text-xs font-medium text-red-600">
              -${formatAmount(balance.expense)}
            </span>
          </div>
          <div className="border-t border-[var(--card-border)] pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--card-fg)]">Balance:</span>
              <span className={`text-sm font-semibold ${
                balance.balance >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {balance.balance >= 0 ? '+' : '-'}${formatAmount(Math.abs(balance.balance))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (balances.length === 0) {
    return null
  }

  if (isMobile) {
    // Mobile: Single card with currency selector inside
    const selectedBalance = balances.find(b => b.currency === selectedCurrency) || balances[0]
    
    return (
      <div className="mb-6">
        {/* Single Card with selector inside */}
        {selectedBalance && renderCard(selectedBalance, true)}
      </div>
    )
  }

  // Desktop: Grid with dynamic columns (max 3, full width when fewer)
  const gridClass = balances.length === 1 
    ? "grid-cols-1" 
    : balances.length === 2 
    ? "grid-cols-2" 
    : "grid-cols-3"

  return (
    <div className={`mb-6 grid ${gridClass} gap-4`}>
      {balances.map(renderCard)}
    </div>
  )
}