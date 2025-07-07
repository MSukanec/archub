import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Building, ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { user, resetPassword } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el email. Verifica que el email esté registrado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building className="h-8 w-8 text-accent" />
              <span className="text-2xl font-bold">ARCHUB</span>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Email enviado</CardTitle>
              <CardDescription>
                Hemos enviado un enlace para restablecer tu contraseña a{" "}
                <strong>{form.getValues('email')}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Revisa tu bandeja de entrada y haz clic en el enlace para continuar.</p>
                <p>Si no ves el email, revisa tu carpeta de spam.</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                >
                  Enviar a otro email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Button>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">ARCHUB</span>
          </div>
          <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
          <p className="text-muted-foreground text-sm">
            Ingresa tu email para recibir un enlace de restablecimiento
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              No te preocupes, es más común de lo que piensas. Te enviaremos un enlace para restablecerla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar enlace de restablecimiento
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm mt-4">
              <span className="text-muted-foreground">¿Recordaste tu contraseña? </span>
              <Button
                variant="link"
                size="sm"
                className="px-0"
                onClick={() => navigate('/login')}
              >
                Inicia sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}