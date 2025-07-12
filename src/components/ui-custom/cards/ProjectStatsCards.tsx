import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Construction, Calculator, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface ProjectStatsCardsProps {
  stats: {
    totalDocuments: number
    totalSiteLogs: number
    totalBudgets: number
    totalMovements: number
  } | null
  isLoading: boolean
}

// Simple chart data for visual appeal
const generateChartData = (baseValue: number) => {
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, baseValue + Math.floor(Math.random() * 3) - 1)
  }))
}

export function ProjectStatsCards({ stats, isLoading }: ProjectStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="mt-4 h-20 bg-gray-200 animate-pulse rounded" />
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
      color: "#3b82f6",
      increase: "+12%"
    },
    {
      title: "Registros de Obra",
      icon: Construction,
      value: stats?.totalSiteLogs || 0,
      description: "entradas de bitácora",
      color: "#f97316",
      increase: "+8%"
    },
    {
      title: "Presupuestos",
      icon: Calculator,
      value: stats?.totalBudgets || 0,
      description: "presupuestos activos",
      color: "#10b981",
      increase: "+15%"
    },
    {
      title: "Movimientos",
      icon: DollarSign,
      value: stats?.totalMovements || 0,
      description: "transacciones",
      color: "#8b5cf6",
      increase: "+23%"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData(card.value)}>
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
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}