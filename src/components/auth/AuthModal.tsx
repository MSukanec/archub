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
      // Success handled by redirect - no toast needed
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
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Columna izquierda - Branding (oculta en mobile) */}
          <div className="hidden md:flex flex-1 bg-gradient-to-br from-slate-900 to-slate-800 p-12 flex-col justify-center relative overflow-hidden">
            {/* Logo */}
            <div className="absolute top-8 left-8">
              <div className="flex items-center space-x-2">
                <Building className="w-8 h-8 text-emerald-400" />
                <span className="text-2xl font-bold text-white">Archub</span>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="space-y-8 relative z-10">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white leading-tight">
                  Gestiona tus proyectos de construcción con inteligencia
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Optimiza cada etapa de tu construcción con herramientas avanzadas de planificación, presupuestos y seguimiento en tiempo real.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-200">Gestión integral de proyectos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-200">Control financiero avanzado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-200">Colaboración en tiempo real</span>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="flex-1 bg-white p-6 md:p-12 flex flex-col justify-center w-full md:max-w-lg">
            <div className="w-full max-w-sm mx-auto">
              {/* Mobile Header con logo */}
              <div className="md:hidden text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Building className="w-8 h-8 text-emerald-600" />
                  <span className="text-2xl font-bold text-gray-900">Archub</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h2>
                <p className="text-gray-600">Inicia sesión en tu cuenta</p>
              </div>
              
              {/* Desktop Header */}
              <div className="hidden md:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h2>
                <p className="text-gray-600">Inicia sesión en tu cuenta</p>
              </div>
        
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="text-sm">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register" className="text-sm">Registrarse</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  {/* Google Login */}
                  <Button 
                    variant="outline" 
                    className="w-full h-11 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 rounded-xl"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        O CONTINÚA CON
                      </span>
                    </div>
                  </div>

                  {/* Email Login Form */}
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium text-gray-900">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium text-gray-900">Contraseña</Label>
                        <span className="text-sm text-gray-500 hover:text-[#92c900] cursor-pointer">
                          ¿Olvidaste tu contraseña?
                        </span>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-[#92c900] hover:bg-[#7ba600] text-white" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-[#92c900] hover:text-[#7ba600] font-medium"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  {/* Google Register */}
                  <Button 
                    variant="outline" 
                    className="w-full h-11 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 rounded-xl"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        O CONTINÚA CON
                      </span>
                    </div>
                  </div>

                  {/* Email Register Form */}
                  <form onSubmit={handleEmailRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm font-medium text-gray-900">Nombre completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre completo"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-medium text-gray-900">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-medium text-gray-900">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-900">Confirmar Contraseña</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="h-11 border-gray-300 bg-white text-gray-900"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-[#92c900] hover:bg-[#7ba600] text-white" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-600">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-[#92c900] hover:text-[#7ba600] font-medium"
                    >
                      Inicia sesión aquí
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