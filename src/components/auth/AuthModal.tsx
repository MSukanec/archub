import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { Building } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const { signIn, signUp, signInWithGoogle, loading } = useAuthStore()
  const { toast } = useToast()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email y contraseña",
        variant: "destructive",
      })
      return
    }

    try {
      await signIn(loginEmail, loginPassword)
      onOpenChange(false)
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesión",
        variant: "destructive",
      })
    }
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerEmail || !registerPassword || !fullName) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (registerPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      await signUp(registerEmail, registerPassword, fullName)
      toast({
        title: "Éxito",
        description: "Cuenta creada correctamente. Revisa tu email para confirmar tu cuenta.",
      })
      onOpenChange(false)
      setRegisterEmail('')
      setRegisterPassword('')
      setConfirmPassword('')
      setFullName('')
      setActiveTab('login')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      })
    }
  }

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesión con Google",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
          {/* Columna izquierda - Branding (oculta en mobile) */}
            {/* Logo */}
              </div>
            </div>

            {/* Contenido principal */}
                  Gestiona tus proyectos de construcción con inteligencia
                </h1>
                  Optimiza cada etapa de tu construcción con herramientas avanzadas de planificación, presupuestos y seguimiento en tiempo real.
                </p>
              </div>

              {/* Features */}
                </div>
                </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
          </div>

          {/* Columna derecha - Formulario */}
              {/* Mobile Header con logo */}
                </div>
              </div>
              
              {/* Desktop Header */}
              </div>
        
                </TabsList>
                
                  {/* Google Login */}
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
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
                    Continuar con Google
                  </Button>

                    </div>
                        o
                      </span>
                    </div>
                  </div>

                  {/* Email Login Form */}
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>

                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                    >
                      Regístrate ahora
                    </button>
                  </p>
                </TabsContent>

                  {/* Google Register */}
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
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
                    Continuar con Google
                  </Button>

                    </div>
                        o
                      </span>
                    </div>
                  </div>

                  {/* Email Register Form */}
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>

                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                    >
                      Inicia sesión
                    </button>
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}