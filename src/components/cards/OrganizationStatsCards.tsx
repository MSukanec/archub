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
      color: "text-[hsl(var(--accent))]",
      bgColor: "bg-[hsl(var(--accent))]",
      description: "proyectos en curso",
      trendData: generateTrendData(activeProjects),
      lineColor: "#92c900"
    },
    {
      title: "Documentos (30 días)",
      value: documentsLast30Days,
      icon: FileText,
      color: "text-[hsl(var(--accent))]",
      bgColor: "bg-[hsl(var(--accent))]",
      description: "documentos subidos",
      trendData: generateTrendData(documentsLast30Days),
      lineColor: "#92c900"
    },
    {
      title: "Tareas Generadas",
      value: generatedTasks,
      icon: Wrench,
      color: "text-[hsl(var(--accent))]",
      bgColor: "bg-[hsl(var(--accent))]",
      description: "tareas creadas",
      trendData: generateTrendData(generatedTasks),
      lineColor: "#92c900"
    },
    {
      title: "Movimientos (30 días)",
      value: financialMovementsLast30Days,
      icon: DollarSign,
      color: "text-[hsl(var(--accent))]",
      bgColor: "bg-[hsl(var(--accent))]",
      description: "total movido",
      isAmount: true,
      trendData: generateTrendData(financialMovementsLast30Days / 1000),
      lineColor: "#92c900"
    }
  ]

  return (
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
              {/* Large Chart Taking Most Space */}
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
              
              {/* Small Icon and Title */}
                <div className={`h-4 w-4 lg:h-5 lg:w-5 rounded-full bg-opacity-20 ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-2 w-2 lg:h-3 lg:w-3 ${stat.color}`} />
                </div>
                  {stat.title}
                </CardTitle>
              </div>
              
              {/* Small Number at Bottom */}
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
              >
                {isLoading ? '...' : (
                  stat.isAmount ? formatCurrency(stat.value) : stat.value.toLocaleString()
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}