import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Email enviado",
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña."
        });
      }
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

  if (emailSent) {
    return (
          {/* Logo */}
            <Link href="/">
              </div>
            </Link>
          </div>

          {/* Success Card */}
              </div>
                Te hemos enviado un enlace para restablecer tu contraseña a{" "}
              </CardDescription>
            </CardHeader>
                  Revisa tu bandeja de entrada y sigue las instrucciones del email.
                  Si no lo encuentras, revisa tu carpeta de spam.
                </p>
                
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                >
                  Enviar a otro email
                </Button>
              </div>

                ¿Recordaste tu contraseña?{" "}
                <Link href="/login">
                    Inicia sesión
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
            <Link href="/">
                ← Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
        {/* Logo */}
          <Link href="/">
            </div>
          </Link>
        </div>

        {/* Forgot Password Card */}
            <CardDescription>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </CardDescription>
          </CardHeader>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

                {isLoading ? (
                  <>
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de restablecimiento"
                )}
              </Button>
            </form>

              ¿Recordaste tu contraseña?{" "}
              <Link href="/login">
                  Inicia sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
          <Link href="/">
              ← Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}