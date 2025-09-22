import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Construction, Calculator, DollarSign, Users, Settings, Zap } from 'lucide-react'
import { useLocation } from 'wouter'

export function ProjectQuickActions() {
  const [, navigate] = useLocation()

  const actions = [
    {
      icon: FileText,
      label: "Documentos",
      description: "Gestionar documentos de diseño",
      onClick: () => navigate('/design/documentation'),
      color: "text-blue-600"
    },
    {
      icon: Construction,
      label: "Bitácora",
      description: "Registros de obra",
      onClick: () => navigate('/construction/site-logs'),
      color: "text-orange-600"
    },
    {
      icon: DollarSign,
      label: "Finanzas",
      description: "Movimientos financieros",
      onClick: () => navigate('/finances/dashboard'),
      color: "text-purple-600"
    },
    {
      icon: Users,
      label: "Clientes",
      description: "Gestionar clientes del proyecto",
      onClick: () => navigate('/commercialization/clients'),
      color: "text-cyan-600"
    },
    {
      icon: Settings,
      label: "Configuración",
      description: "Datos básicos del proyecto",
      onClick: () => navigate('/organization/projects'), // Navegación a gestión de proyectos
      color: "text-gray-600"
    }
  ]

  return (
    <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[var(--accent)]" />
          <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Accesos directos a las funciones principales
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent/50 bg-[var(--card-bg)] border-[var(--card-border)]"
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <div className="text-center">
                <div className="font-medium text-sm text-foreground">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}