import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const [, setLocation] = useLocation()
  const { data: currentUser } = useCurrentUser()

  const handleGoHome = () => {
    if (currentUser?.user?.id) {
      setLocation("/dashboard")
    } else {
      setLocation("/")
    }
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 max-w-md">
          {/* Large 404 Number */}
          <div className="text-9xl font-bold text-muted-foreground/30">
            404
          </div>
          
          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Página no encontrada
            </h1>
            <p className="text-muted-foreground">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </Button>
            <Button onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {currentUser?.user?.id ? "Ir al Dashboard" : "Ir al Inicio"}
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-sm text-muted-foreground">
            Si crees que esto es un error, contacta al soporte técnico.
          </div>
        </div>
      </div>
    </div>
  )
}