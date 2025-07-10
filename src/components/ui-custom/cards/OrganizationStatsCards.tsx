import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileText, Wrench, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface OrganizationStatsCardsProps {
  activeProjects: number
  documentsLast30Days: number
  generatedTasks: number
  financialMovementsLast30Days: number
  isLoading?: boolean
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Generate sample trend data for mini charts
const generateTrendData = (baseValue: number) => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i,
    value: Math.max(0, baseValue + Math.floor(Math.random() * 20 - 10))
  }))
}

export function OrganizationStatsCards({
  activeProjects,
  documentsLast30Days,
  generatedTasks,
  financialMovementsLast30Days,
  isLoading = false
}: OrganizationStatsCardsProps) {
  const stats = [
    {
      title: "Proyectos Activos",
      value: activeProjects,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "proyectos en curso",
      trendData: generateTrendData(activeProjects),
      lineColor: "#2563eb"
    },
    {
      title: "Documentos (30 días)",
      value: documentsLast30Days,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "documentos subidos",
      trendData: generateTrendData(documentsLast30Days),
      lineColor: "#16a34a"
    },
    {
      title: "Tareas Generadas",
      value: generatedTasks,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "tareas creadas",
      trendData: generateTrendData(generatedTasks),
      lineColor: "#ea580c"
    },
    {
      title: "Movimientos (30 días)",
      value: financialMovementsLast30Days,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "total movido",
      isAmount: true,
      trendData: generateTrendData(financialMovementsLast30Days / 1000),
      lineColor: "#9333ea"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-xs lg:text-sm font-medium truncate">{stat.title}</CardTitle>
                <div className={`h-6 w-6 lg:h-8 lg:w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.color}`} />
                </div>
              </div>
              {/* Mini Chart */}
              <div className="h-8 w-16 lg:h-10 lg:w-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.trendData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={stat.lineColor}
                      strokeWidth={2}
                      dot={false}
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <motion.div 
                className="text-lg lg:text-2xl font-bold mb-1"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
              >
                {isLoading ? '...' : (
                  stat.isAmount ? formatCurrency(stat.value) : stat.value.toLocaleString()
                )}
              </motion.div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}