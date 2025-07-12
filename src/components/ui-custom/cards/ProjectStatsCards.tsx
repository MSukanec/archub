import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Construction, Calculator, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProjectStatsCardsProps {
  stats: {
    totalDocuments: number
    totalSiteLogs: number
    totalBudgets: number
    totalMovements: number
  } | null
  isLoading: boolean
}

export function ProjectStatsCards({ stats, isLoading }: ProjectStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mb-1" />
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
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
      description: "Total documentos",
      color: "text-blue-600"
    },
    {
      title: "Registros de Obra",
      icon: Construction,
      value: stats?.totalSiteLogs || 0,
      description: "Entradas de bitácora",
      color: "text-orange-600"
    },
    {
      title: "Presupuestos",
      icon: Calculator,
      value: stats?.totalBudgets || 0,
      description: "Presupuestos creados",
      color: "text-green-600"
    },
    {
      title: "Movimientos",
      icon: DollarSign,
      value: stats?.totalMovements || 0,
      description: "Transacciones",
      color: "text-purple-600"
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
              >
                {card.value}
              </motion.div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}