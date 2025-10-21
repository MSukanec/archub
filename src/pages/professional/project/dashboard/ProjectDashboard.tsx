import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'
import { useProjectContext } from '@/stores/projectContext'

export default function ProjectDashboard() {
  const { selectedProjectId } = useProjectContext()

  // Empty state if no project selected
  if (!selectedProjectId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <div 
          className="rounded-lg p-8 text-center border"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--card-border)',
            color: 'var(--card-text)'
          }}
        >
          <Construction className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un Proyecto</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un proyecto desde el menú superior para ver su dashboard.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <div 
        className="rounded-lg p-12 text-center border"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--card-border)',
          color: 'var(--card-text)'
        }}
      >
        <Construction className="h-16 w-16 mx-auto mb-6 opacity-50" style={{ color: 'var(--accent)' }} />
        <h2 className="text-2xl font-bold mb-3">Dashboard del Proyecto</h2>
        <p className="text-lg text-muted-foreground mb-2">
          Próximamente disponible
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Estamos trabajando en un panel de control completo con métricas de progreso, cumplimiento, 
          presupuesto y documentación para una gestión integral de tus proyectos.
        </p>
      </div>
    </motion.div>
  )
}
