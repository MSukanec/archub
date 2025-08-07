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
      icon: Calculator,
      label: "Presupuestos",
      description: "Gestionar presupuestos",
      onClick: () => navigate('/construction/budgets'),
      color: "text-green-600"
    },
    {
      icon: DollarSign,
      label: "Finanzas",
      description: "Movimientos financieros",
      onClick: () => navigate('/finances/movements'),
      color: "text-purple-600"
    },
    {
      icon: Users,
      label: "Clientes",
      description: "Gestionar clientes del proyecto",
      onClick: () => navigate('/project/clients'),
      color: "text-cyan-600"
    },
    {
      icon: Settings,
      label: "Configuración",
      description: "Datos básicos del proyecto",
      onClick: () => navigate('/project/basic-data'),
      color: "text-gray-600"
    }
  ]

  return (
        </div>
          Accesos directos a las funciones principales
        </p>
      </CardHeader>
      <CardContent>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}