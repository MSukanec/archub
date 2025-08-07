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
          {/* Large 404 Number */}
            404
          </div>
          
          {/* Error Message */}
              Página no encontrada
            </h1>
              La página que buscas no existe o ha sido movida.
            </p>
          </div>

          {/* Action Buttons */}
              Volver atrás
            </Button>
              {currentUser?.user?.id ? "Ir al Dashboard" : "Ir al Inicio"}
            </Button>
          </div>

          {/* Additional Help */}
            Si crees que esto es un error, contacta al soporte técnico.
          </div>
        </div>
      </div>
    </div>
  )
}