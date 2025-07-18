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
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'Negativo':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'Neutro':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400'
    if (balance < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--table-border)]">
        <table className="w-full">
          <thead className="bg-[var(--table-header-bg)] border-b border-[var(--table-header-border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Billetera
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--table-row-bg)] divide-y divide-[var(--table-border)]">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--table-border)]">
        <table className="w-full">
          <thead className="bg-[var(--table-header-bg)] border-b border-[var(--table-header-border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Billetera
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--table-row-bg)]">
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-[var(--table-row-fg)]">
                <div className="flex flex-col items-center gap-2">
                  <Wallet2 className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No hay datos de balances disponibles</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--table-border)]">
      <table className="w-full">
        {/* Table Header */}
        <thead className="bg-[var(--table-header-bg)] border-b border-[var(--table-header-border)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
              Moneda
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
              Billetera
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
              Balance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--table-header-fg)] uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-[var(--table-row-bg)] divide-y divide-[var(--table-border)]">
          {data.map((item, index) => (
            <tr 
              key={`${item.wallet}-${item.currency}-${index}`} 
              className="hover:bg-[var(--table-row-hover-bg)] transition-colors duration-150"
            >
              {/* Moneda */}
              <td className="px-4 py-3 text-sm text-[var(--table-row-fg)]">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{item.currency}</span>
                </div>
              </td>

              {/* Billetera */}
              <td className="px-4 py-3 text-sm text-[var(--table-row-fg)]">
                <div className="flex items-center gap-2">
                  <Wallet2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.wallet}</span>
                </div>
              </td>

              {/* Balance */}
              <td className="px-4 py-3 text-sm">
                <span className={`font-semibold ${getBalanceColor(item.balance)}`}>
                  {formatCurrency(item.balance)}
                </span>
              </td>

              {/* Estado */}
              <td className="px-4 py-3 text-sm">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStateColor(item.state)}`}
                >
                  {item.state}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}