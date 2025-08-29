import React from 'react'
import { FolderX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectContext } from '@/stores/projectContext'

interface RequireProjectWrapperProps {
  children: React.ReactNode
  headerProps?: any
}

export function RequireProjectWrapper({ children, headerProps }: RequireProjectWrapperProps) {
  const { isGlobalView } = useProjectContext()

  if (isGlobalView) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <FolderX className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">
                Esta sección requiere que selecciones un proyecto
              </h2>
              <p className="text-muted-foreground mb-6">
                Para acceder a esta funcionalidad, debes seleccionar un proyecto específico en lugar de ver todos los proyectos.
              </p>
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Utiliza el selector de proyectos en la barra lateral para seleccionar un proyecto y continuar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return <>{children}</>
}