import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { AlertTriangle } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export function AuthAdmin({ children }: AdminProtectedRouteProps) {
  const { data, isLoading } = useAdminPermissions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!data?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Contacta al administrador del sistema si necesitas acceso.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}