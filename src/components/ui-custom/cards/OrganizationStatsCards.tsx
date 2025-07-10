import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileText, Wrench, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

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
      description: "proyectos en curso"
    },
    {
      title: "Documentos (30 días)",
      value: documentsLast30Days,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "documentos subidos"
    },
    {
      title: "Tareas Generadas",
      value: generatedTasks,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "tareas creadas"
    },
    {
      title: "Movimientos (30 días)",
      value: financialMovementsLast30Days,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "total movido",
      isAmount: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold"
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