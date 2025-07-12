import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useLocation } from 'wouter'

interface FinancialStatsCardsProps {
  stats: {
    totalIncome: number
    totalExpenses: number
    balance: number
    totalMovements: number
  } | null
  isLoading: boolean
}

// Generate realistic trend data for mini charts based on actual values
const generateTrendData = (currentValue: number) => {
  // If value is 0, show flat line
  if (currentValue === 0) {
    return Array.from({ length: 7 }, (_, i) => ({ day: i, value: 0 }))
  }
  
  // For non-zero values, create realistic progression
  const data = []
  let startValue = Math.max(0, currentValue - Math.min(15, currentValue * 0.5))
  
  for (let i = 0; i < 7; i++) {
    if (i === 6) {
      // Last point should be the current real value
      data.push({ day: i, value: currentValue })
    } else {
      // Generate progression towards current value
      const progress = i / 6
      const variance = (Math.random() - 0.5) * Math.min(8, currentValue * 0.2)
      const progressValue = startValue + (currentValue - startValue) * progress + variance
      data.push({ day: i, value: Math.max(0, Math.round(progressValue)) })
    }
  }
  
  return data
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function FinancialStatsCards({ stats, isLoading }: FinancialStatsCardsProps) {
  const [, navigate] = useLocation()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-20 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="h-8 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Ingresos Totales",
      icon: TrendingUp,
      value: stats?.totalIncome || 0,
      description: "acumulado histórico",
      href: "/finances/movements",
      buttonText: "Ver Movimientos",
      color: "text-green-600",
      bgColor: "bg-green-600",
      trendData: generateTrendData(stats?.totalIncome || 0),
      lineColor: "#22c55e"
    },
    {
      title: "Egresos Totales", 
      icon: TrendingDown,
      value: stats?.totalExpenses || 0,
      description: "total gastado",
      href: "/finances/movements", 
      buttonText: "Ver Movimientos",
      color: "text-red-600",
      bgColor: "bg-red-600",
      trendData: generateTrendData(stats?.totalExpenses || 0),
      lineColor: "#ef4444"
    },
    {
      title: "Balance General",
      icon: DollarSign,
      value: stats?.balance || 0,
      description: "balance actual",
      href: "/finances/movements",
      buttonText: "Ver Movimientos", 
      color: (stats?.balance || 0) >= 0 ? "text-green-600" : "text-red-600",
      bgColor: (stats?.balance || 0) >= 0 ? "bg-green-600" : "bg-red-600",
      trendData: generateTrendData(Math.abs(stats?.balance || 0)),
      lineColor: (stats?.balance || 0) >= 0 ? "#22c55e" : "#ef4444"
    },
    {
      title: "Total Movimientos",
      icon: FileText,
      value: stats?.totalMovements || 0,
      description: "registros totales",
      href: "/finances/movements",
      buttonText: "Ver Movimientos",
      color: "text-[hsl(var(--accent))]",
      bgColor: "bg-[hsl(var(--accent))]",
      trendData: generateTrendData(stats?.totalMovements || 0),
      lineColor: "hsl(var(--accent))"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--card-fg)]">{card.title}</p>
                  <div className="flex items-center gap-2">
                    <motion.p 
                      className={`text-2xl font-bold ${card.color}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {card.title.includes('Movimientos') ? card.value : formatCurrency(Math.abs(card.value))}
                    </motion.p>
                  </div>
                  <p className="text-xs text-[var(--muted-fg)]">{card.description}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor} bg-opacity-10`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="h-20 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={card.trendData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={card.lineColor}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: card.lineColor }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(card.href)}
              >
                {card.buttonText}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}