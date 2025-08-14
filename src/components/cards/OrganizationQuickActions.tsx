import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Users, 
  Building, 
  FileText, 
  DollarSign, 
  Zap,
  Construction
} from 'lucide-react'
import { useLocation } from 'wouter'
import { motion } from 'framer-motion'

export function OrganizationQuickActions() {
  const [, navigate] = useLocation()

  const quickActions = [
    {
      title: "Crear Proyecto",
      description: "Nuevo proyecto de construcción",
      icon: Building,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/profile/projects')
    },
    {
      title: "Agregar Contacto",
      description: "Nuevo cliente o proveedor",
      icon: Users,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/organization/contacts')
    },
    {
      title: "Subir Documento",
      description: "Documentos de diseño",
      icon: FileText,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/design/documentation')
    },
    {
      title: "Nuevo Movimiento",
      description: "Registrar ingreso o gasto",
      icon: DollarSign,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/finances/movements')
    },
    {
      title: "Bitácora de Obra",
      description: "Registrar actividad diaria",
      icon: Construction,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/construction/logs')
    },
    {
      title: "Invitar Miembro",
      description: "Nuevo miembro del equipo",
      icon: Users,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      onClick: () => navigate('/organization/members')
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start hover:shadow-md transition-all duration-200"
                onClick={action.onClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`h-10 w-10 rounded-full ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}