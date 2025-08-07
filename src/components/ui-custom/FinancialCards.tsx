import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMobile } from '@/hooks/use-mobile'
import { MobileCurrencyCard } from '@/components/cards/MobileCurrencyCard'

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
          {balance.currency}
        </CardTitle>
      </CardHeader>
              +${formatAmount(balance.income)}
            </span>
          </div>
              -${formatAmount(balance.expense)}
            </span>
          </div>
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