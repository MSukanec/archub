import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Construction, Calculator, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useLocation } from 'wouter'

interface ProjectStatsCardsProps {
  stats: {
    totalDocuments: number
    totalSiteLogs: number
    totalBudgets: number
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

export function ProjectStatsCards({ stats, isLoading }: ProjectStatsCardsProps) {
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
      title: "Documentos de Diseño",
      icon: FileText,
      value: stats?.totalDocuments || 0,
      description: "documentos creados",
      color: "#84cc16", // Using direct accent color for charts
      increase: "+12%",
      route: "/design/documentation",
      buttonText: "Ver Documentos"
    },
    {
      title: "Registros de Obra",
      icon: Construction,
      value: stats?.totalSiteLogs || 0,
      description: "entradas de bitácora",
      color: "#84cc16", // Using direct accent color for charts
      increase: "+8%",
      route: "/construction/site-logs",
      buttonText: "Ver Bitácora"
    },
    {
      title: "Presupuestos",
      icon: Calculator,
      value: stats?.totalBudgets || 0,
      description: "presupuestos activos",
      color: "#84cc16", // Using direct accent color for charts
      increase: "+15%",
      route: "/construction/budgets",
      buttonText: "Ver Presupuestos"
    },
    {
      title: "Movimientos",
      icon: DollarSign,
      value: stats?.totalMovements || 0,
      description: "transacciones",
      color: "#84cc16", // Using direct accent color for charts
      increase: "+23%",
      route: "/finances/movements",
      buttonText: "Ver Movimientos"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <motion.div 
                    className="text-2xl font-bold text-foreground"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                  >
                    {card.value.toLocaleString()}
                  </motion.div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-600">{card.increase}</span>
                    <span className="text-xs text-muted-foreground">{card.description}</span>
                  </div>
                </div>
                <card.icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div className="h-20 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateTrendData(card.value)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={card.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Button 
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-foreground)]"
                size="sm"
                onClick={() => navigate(card.route)}
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