import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { signUp, signInWithGoogle, loading } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Las contraseñas no coinciden."
      });
      setIsLoading(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La contraseña debe tener al menos 6 caracteres."
      });
      setIsLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.fullName);
      // Don't navigate manually - let AuthGuard handle the flow
      // In development, email confirmation is disabled so user gets logged in automatically
      toast({
        title: "¡Registro exitoso!",
        description: "Configurando tu cuenta..."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado. Intenta nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--layout-bg)' }}>
      <div className="w-full max-w-md">
        <Card className="bg-white border-gray-200">
          <CardHeader className="space-y-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Building className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-2xl font-bold text-gray-900">Archub</span>
            </div>
            <CardTitle className="text-xl text-gray-900">Comenzar gratis</CardTitle>
            <CardDescription className="text-gray-600">
              Crea tu cuenta y empieza a gestionar proyectos hoy mismo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign Up */}
            <Button
              variant="default"
              className="w-full h-10 rounded-xl"
              onClick={handleGoogleSignUp}
              disabled={loading}
              data-testid="button-google-signup"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continuar con Google
            </Button>

            {/* Email Sign Up - Disabled */}
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed hover:bg-gray-100"
                disabled
                data-testid="button-email-signup-disabled"
              >
                <Mail className="w-4 h-4 mr-2" />
                Continuar con Email
                <Lock className="w-3 h-3 ml-2" />
              </Button>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400">Próximamente disponible</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">¿Ya tienes una cuenta? </span>
              <Link href="/login">
                <Button variant="link" className="px-0 text-[#92c900] hover:text-[#7ba600]">
                  Inicia sesión aquí
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}