import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const { signInWithGoogle, loading } = useAuthStore();
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al registrarse con Google"
      });
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--main-sidebar-bg)' }}>
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">
        <div className="max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/Seencel512.png" 
              alt="Seencel Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold !text-white">
              Comienza a
              <br />
              <span style={{ color: 'var(--accent)' }}>Construir el Futuro</span>
            </h1>
            <p className="text-base !text-gray-400">
              Únete a cientos de profesionales que ya optimizan sus proyectos con Seencel.
              La herramienta completa para gestión de construcción.
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 pt-8">
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="w-full flex-1 flex items-stretch p-4 lg:p-6">
          <div className="w-full h-full flex flex-col rounded-3xl px-6 lg:px-16 py-6" style={{ backgroundColor: 'var(--layout-bg)' }}>
            {/* Logo + Sign in link - Fixed at top */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <img 
                  src="/Seencel512.png" 
                  alt="Seencel Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="text-sm">
                <span className="text-gray-600">¿Ya tienes cuenta? </span>
                <Link href="/login">
                  <span className="font-semibold cursor-pointer hover:underline" style={{ color: 'var(--accent)' }}>
                    Inicia sesión
                  </span>
                </Link>
              </div>
            </div>

            {/* Card Content - Centered vertically */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md space-y-8">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-gray-900">Comenzar gratis</h1>
                  <p className="text-gray-600">
                    Crea tu cuenta y empieza a gestionar proyectos hoy mismo
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Google Sign Up */}
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2 font-medium text-gray-900 hover:bg-background hover:text-gray-900 hover:!border-border shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    data-testid="button-google-signup"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC04"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Registrarse con Google
                  </Button>

                  {/* Email Sign Up - Disabled */}
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed hover:bg-gray-100 font-medium"
                    disabled
                    data-testid="button-email-signup-disabled"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Continuar con Email
                    <Lock className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="text-center -mt-2">
                    <span className="text-xs text-gray-400">Próximamente disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}