import React from 'react'
import { FolderX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectContext } from '@/stores/projectContext'
import { ProjectSelector } from '@/components/navigation/ProjectSelector'

interface RequireProjectWrapperProps {
  children: React.ReactNode
  headerProps?: any
}

export function RequireProjectWrapper({ children, headerProps }: RequireProjectWrapperProps) {
  const { isGlobalView } = useProjectContext()

  if (isGlobalView) {
    return (
      <Layout headerProps={headerProps}>
                Esta sección requiere que selecciones un proyecto
              </h2>
                Para acceder a esta funcionalidad, debes seleccionar un proyecto específico en lugar de ver todos los proyectos.
              </p>
                  Selecciona un proyecto para continuar:
                </p>
                <ProjectSelector />
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return <>{children}</>
}