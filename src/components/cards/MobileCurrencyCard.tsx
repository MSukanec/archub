import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CurrencyBalance {
  currency: string
  income: number
  expense: number
  balance: number
}

interface MobileCurrencyCardProps {
  balances: CurrencyBalance[]
  defaultCurrency?: string
}

export const MobileCurrencyCard = ({ balances, defaultCurrency }: MobileCurrencyCardProps) => {
  // State for mobile currency selection
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Default to organization's default currency or first available
    return defaultCurrency || balances[0]?.currency || ''
  })

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount)
  }

  if (balances.length === 0) {
    return null
  }

  const selectedBalance = balances.find(b => b.currency === selectedCurrency) || balances[0]

  if (!selectedBalance) {
    return null
  }

  return (
    <div className="mb-6">
      <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[var(--card-fg)] flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {selectedBalance.currency}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Currency Selector for Mobile - inside card */}
            {balances.length > 1 && (
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
                +${formatAmount(selectedBalance.income)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--muted-fg)]">Egresos:</span>
              <span className="text-xs font-medium text-red-600">
                -${formatAmount(selectedBalance.expense)}
              </span>
            </div>
            <div className="border-t border-[var(--card-border)] pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--card-fg)]">Balance:</span>
                <span className={`text-sm font-semibold ${
                  selectedBalance.balance >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {selectedBalance.balance >= 0 ? '+' : '-'}${formatAmount(Math.abs(selectedBalance.balance))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}