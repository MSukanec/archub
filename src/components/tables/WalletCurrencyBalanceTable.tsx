import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Wallet2, DollarSign } from 'lucide-react'

interface WalletCurrencyBalance {
  wallet: string
  currency: string
  balance: number
  state: 'Positivo' | 'Negativo' | 'Neutro'
}

interface WalletCurrencyBalanceTableProps {
  data: WalletCurrencyBalance[]
  isLoading?: boolean
}

export function WalletCurrencyBalanceTable({ data, isLoading }: WalletCurrencyBalanceTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(Math.abs(amount))
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Positivo':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Negativo':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Neutro':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
          <span>Moneda</span>
          <span>Billetera</span>
          <span>Balance</span>
          <span>Estado</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4 text-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Wallet2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm">No hay datos de balances disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
        <span>Moneda</span>
        <span>Billetera</span>
        <span>Balance</span>
        <span>Estado</span>
      </div>

      {/* Data rows */}
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {data.map((item, index) => (
          <div key={`${item.wallet}-${item.currency}-${index}`} className="grid grid-cols-4 gap-4 text-sm items-center py-2">
            {/* Moneda */}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{item.currency}</span>
            </div>

            {/* Billetera */}
            <div className="flex items-center gap-2">
              <Wallet2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{item.wallet}</span>
            </div>

            {/* Balance */}
            <div className={`font-semibold ${getBalanceColor(item.balance)}`}>
              {formatCurrency(item.balance)}
            </div>

            {/* Estado */}
            <div>
              <Badge 
                variant="outline" 
                className={`text-xs ${getStateColor(item.state)}`}
              >
                {item.state}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}