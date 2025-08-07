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
            {selectedBalance.currency}
          </CardTitle>
        </CardHeader>
            {/* Currency Selector for Mobile - inside card */}
            {balances.length > 1 && (
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
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
            
                +${formatAmount(selectedBalance.income)}
              </span>
            </div>
                -${formatAmount(selectedBalance.expense)}
              </span>
            </div>
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