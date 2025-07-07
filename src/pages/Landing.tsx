import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { Building, Users, BarChart3, FileText, CheckCircle, ArrowRight, Zap, Shield } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Building,
      title: "Gestión de Proyectos",
      description: "Organiza y controla todos tus proyectos de construcción desde una sola plataforma."
    },
    {
      icon: Users,
      title: "Colaboración en Equipo",
      description: "Coordina equipos, asigna tareas y mantén a todos sincronizados en tiempo real."
    },
    {
      icon: BarChart3,
      title: "Control Financiero",
      description: "Monitorea presupuestos, gastos y rentabilidad con dashboards intuitivos."
    },
    {
      icon: FileText,
      title: "Documentación Técnica",
      description: "Centraliza planos, especificaciones y documentos del proyecto."
    }
  ];

  const benefits = [
    "Reduce tiempos de gestión hasta 50%",
    "Mejora la comunicación del equipo",
    "Control total de costos y presupuestos",
    "Documentación organizada y accesible",
    "Reportes automáticos y analíticas",
    "Acceso desde cualquier dispositivo"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">ARCHUB</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button onClick={() => navigate('/register')}>
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            La plataforma de gestión para construcción más avanzada
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transforma la manera en que gestionas proyectos de construcción. 
            Controla equipos, presupuestos y cronogramas desde una sola herramienta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/register')}>
              Comenzar gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/login')}>
              Ver demo
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Seguro y confiable</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Configuración en 5 minutos</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Todo lo que necesitas para gestionar construcción
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Archub integra todas las herramientas esenciales para la gestión de proyectos 
            de construcción en una plataforma moderna y fácil de usar.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-accent/10">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                ¿Por qué elegir Archub?
              </h2>
              <p className="text-muted-foreground">
                Únete a cientos de profesionales que ya optimizaron sus proyectos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Card className="p-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardHeader className="text-center p-0 mb-6">
                  <CardTitle className="text-2xl">Comienza hoy</CardTitle>
                  <CardDescription>
                    Configuración gratuita en minutos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <Button className="w-full" size="lg" onClick={() => navigate('/register')}>
                    Crear cuenta gratis
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/login')}>
                    Ya tengo cuenta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">ARCHUB</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Archub. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}