import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMobile } from '@/hooks/use-mobile'
import { MobileCurrencyCard } from '@/components/ui/cards/MobileCurrencyCard'

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount)
  }

  const renderDesktopCard = (balance: CurrencyBalance) => (
    <Card key={balance.currency} className="bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--card-fg)] flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {balance.currency}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
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
    // Mobile: Use separate MobileCurrencyCard component
    return <MobileCurrencyCard balances={balances} defaultCurrency={defaultCurrency} />
  }

  // Desktop: Grid with maximum 4 cards
  const limitedBalances = balances.slice(0, 4)
  const gridClass = limitedBalances.length === 1 
    ? "grid-cols-1" 
    : limitedBalances.length === 2 
    ? "grid-cols-2" 
    : limitedBalances.length === 3
    ? "grid-cols-3"
    : "grid-cols-4"

  return (
    <div className={`mb-6 grid ${gridClass} gap-4`}>
      {limitedBalances.map(renderDesktopCard)}
    </div>
  )
}