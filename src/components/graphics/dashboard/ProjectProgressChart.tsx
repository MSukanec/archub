import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react'

interface ProjectProgressData {
  phase: string
  completed: number
  total: number
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk'
  icon: React.ComponentType<any>
}

interface ProjectProgressChartProps {
  data: ProjectProgressData[]
}

export function ProjectProgressChart({ data }: ProjectProgressChartProps) {
  const overallProgress = data.reduce((acc, phase) => {
    return acc + (phase.completed / phase.total)
  }, 0) / data.length * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--chart-1)'
      case 'in_progress': return 'var(--accent)'
      case 'pending': return 'var(--chart-4)'
      case 'at_risk': return 'var(--destructive)'
      default: return 'var(--chart-3)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" style={{ color: 'var(--chart-1)' }} />
      case 'in_progress': return <Clock className="h-4 w-4" style={{ color: 'var(--accent)' }} />
      case 'at_risk': return <AlertCircle className="h-4 w-4" style={{ color: 'var(--destructive)' }} />
      default: return <Building2 className="h-4 w-4" style={{ color: 'var(--chart-3)' }} />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          Progreso General del Proyecto
        </CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso Total</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-3"
            style={{
              '--progress-background': 'var(--accent)',
            } as React.CSSProperties}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((phase, index) => {
          const progress = (phase.completed / phase.total) * 100
          const Icon = phase.icon

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: getStatusColor(phase.status) }} />
                  <span className="text-sm font-medium">{phase.phase}</span>
                  {getStatusIcon(phase.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {phase.completed}/{phase.total}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: getStatusColor(phase.status) }}>
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                style={{
                  '--progress-background': getStatusColor(phase.status),
                } as React.CSSProperties}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}