import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { AlertTriangle } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { data, isLoading } = useAdminPermissions()

  if (isLoading) {
    return (
        </div>
      </div>
    )
  }

  if (!data?.isAdmin) {
    return (
          </div>
            Acceso Denegado
          </h2>
            No tienes permisos de administrador para acceder a esta página.
          </p>
            Contacta al administrador del sistema si necesitas acceso.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}