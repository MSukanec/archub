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
          <span>Moneda</span>
          <span>Billetera</span>
          <span>Balance</span>
        </div>
        {[1, 2, 3].map((i) => (
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
        </div>
      </div>
    )
  }

  // Helper function to get currency code (ARS, USD, etc.)
  const getCurrencyCode = (currencyName: string) => {
    const currencyMap: { [key: string]: string } = {
      'peso argentino': 'ARS',
      'pesos argentinos': 'ARS',
      'peso': 'ARS',
      'pesos': 'ARS',
      'dólar estadounidense': 'USD',
      'dolares estadounidenses': 'USD',
      'dólar': 'USD',
      'dólares': 'USD',
      'dollar': 'USD',
      'dollars': 'USD',
      'euro': 'EUR',
      'euros': 'EUR'
    }
    
    const normalized = currencyName.toLowerCase().trim()
    return currencyMap[normalized] || currencyName.toUpperCase().substring(0, 3)
  }

  return (
      {/* Header */}
        <span>Moneda</span>
        <span>Billetera</span>
        <span>Balance</span>
      </div>

      {/* Data rows */}
        {data.map((item, index) => (
            {/* Moneda */}
            </div>

            {/* Billetera */}
            </div>

            {/* Balance */}
            <div className={`font-semibold ${getBalanceColor(item.balance)}`}>
              {formatCurrency(item.balance)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}