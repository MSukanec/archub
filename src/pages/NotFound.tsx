import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();

  const handleGoHome = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Building className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">ARCHUB</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2">Página no encontrada</CardTitle>
              <CardDescription className="text-base">
                La página que buscas no existe o ha sido movida a otra ubicación.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Esto puede suceder por varios motivos:</p>
              <ul className="text-left space-y-1 ml-4">
                <li>• La URL fue escrita incorrectamente</li>
                <li>• El enlace está desactualizado</li>
                <li>• La página fue movida o eliminada</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleGoHome}
              >
                <Home className="mr-2 h-4 w-4" />
                {user ? 'Ir al Dashboard' : 'Ir al Inicio'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver atrás
              </Button>
            </div>

            {user && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Accesos rápidos:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/organization')}
                  >
                    Organización
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/projects')}
                  >
                    Proyectos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/finances')}
                  >
                    Finanzas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/profile')}
                  >
                    Perfil
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}