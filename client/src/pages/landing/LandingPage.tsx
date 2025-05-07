import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Building2, 
  Check, 
  ChevronRight, 
  Clock, 
  CreditCard,
  FileText, 
  PackageCheck, 
  Ruler, 
  Shield, 
  Wrench
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Si el usuario ya inició sesión, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Building2 className="h-10 w-10 text-primary" />,
      title: "Gestión de Proyectos",
      description: "Organiza todos tus proyectos de construcción en un solo lugar."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Presupuestos Detallados",
      description: "Crea presupuestos precisos con costos actualizados de materiales."
    },
    {
      icon: <PackageCheck className="h-10 w-10 text-primary" />,
      title: "Inventario de Materiales",
      description: "Seguimiento completo de materiales por proyecto y categoría."
    },
    {
      icon: <Ruler className="h-10 w-10 text-primary" />,
      title: "Estimación de Costos",
      description: "Calcula automáticamente costos basados en tareas y materiales."
    },
    {
      icon: <Wrench className="h-10 w-10 text-primary" />,
      title: "Tareas y Actividades",
      description: "Define y asigna tareas específicas para cada fase del proyecto."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Seguimiento en Tiempo Real",
      description: "Monitorea el progreso de tus proyectos en tiempo real."
    }
  ];

  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: "$999",
      period: "por mes",
      description: "Ideal para profesionales independientes.",
      features: [
        "Hasta 3 proyectos activos",
        "Gestión básica de materiales",
        "Presupuestos simples",
        "Acceso desde 1 dispositivo",
        "Soporte por email"
      ],
      buttonText: "Comenzar Gratis",
      popular: false
    },
    {
      id: "professional",
      name: "Profesional",
      price: "$2,499",
      period: "por mes",
      description: "Perfecto para pequeñas empresas constructoras.",
      features: [
        "Hasta 10 proyectos activos",
        "Gestión avanzada de materiales",
        "Presupuestos detallados con exportación",
        "Acceso desde 3 dispositivos",
        "Soporte prioritario",
        "Dashboard de analíticas"
      ],
      buttonText: "Prueba Gratuita",
      popular: true
    },
    {
      id: "enterprise",
      name: "Empresarial",
      price: "$4,999",
      period: "por mes",
      description: "Para constructoras medianas y grandes.",
      features: [
        "Proyectos ilimitados",
        "Gestión completa de inventario",
        "Presupuestos avanzados con comparativas",
        "Acceso para equipos ilimitados",
        "Soporte dedicado 24/7",
        "API personalizada",
        "Integración con sistemas contables"
      ],
      buttonText: "Contactar Ventas",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra de navegación */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary">Características</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary">Precios</a>
            <a href="#faq" className="text-sm font-medium hover:text-primary">Preguntas Frecuentes</a>
          </nav>
          <div>
            <Button onClick={() => navigate("/auth/login")} variant="outline" className="mr-2">
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth/register")} className="bg-primary hover:bg-primary/90">
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Administra tus Proyectos de Construcción
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {APP_NAME} te ayuda a gestionar presupuestos, materiales y tareas para tus proyectos de construcción de manera eficiente.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button 
                  onClick={() => navigate("/auth/login")} 
                  className="bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Comenzar Ahora
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Ver Demo
                </Button>
              </div>
            </div>
            <div className="mx-auto flex items-center justify-center">
              <div className="relative w-full max-w-full">
                <img
                  alt="Hero Image"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center"
                  src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Todo lo que Necesitas para tus Proyectos
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
              {APP_NAME} ofrece todas las herramientas necesarias para gestionar tus proyectos de construcción de principio a fin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-md transition-all">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Planes de Suscripción
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
              Elige el plan que mejor se adapte a tus necesidades.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${
                  plan.popular 
                    ? 'border-primary shadow-md scale-105 z-10' 
                    : hoveredCard === plan.id 
                      ? 'shadow-md border-gray-300' 
                      : 'border-gray-200'
                } transition-all duration-200`}
                onMouseEnter={() => setHoveredCard(plan.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                    Más Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-xl text-gray-500">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-4">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={plan.popular ? "bg-primary hover:bg-primary/90 w-full" : "w-full"} 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section id="faq" className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Preguntas Frecuentes
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
              Respuestas a las preguntas más comunes sobre {APP_NAME}.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Qué es {APP_NAME}?</h3>
                <p className="text-gray-500">
                  {APP_NAME} es una plataforma diseñada para profesionales de la construcción que permite gestionar proyectos, presupuestos, materiales y tareas en un solo lugar.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Puedo probar {APP_NAME} antes de suscribirme?</h3>
                <p className="text-gray-500">
                  Sí, ofrecemos una prueba gratuita de 14 días con todas las funcionalidades del plan Profesional.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Necesito instalar algo para usar {APP_NAME}?</h3>
                <p className="text-gray-500">
                  No, {APP_NAME} es una aplicación web que funciona en cualquier navegador moderno. No necesitas instalar nada para comenzar a usarla.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
                <p className="text-gray-500">
                  Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Mis datos están seguros?</h3>
                <p className="text-gray-500">
                  Absolutamente. Utilizamos encriptación de nivel bancario para proteger tus datos y nunca compartimos tu información con terceros.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">¿Cómo puedo obtener soporte?</h3>
                <p className="text-gray-500">
                  Ofrecemos soporte por email para todos los planes. Los planes Profesional y Empresarial incluyen soporte prioritario y dedicado respectivamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Comienza a Optimizar tus Proyectos Hoy
          </h2>
          <p className="mx-auto max-w-[700px] mb-8 opacity-90 md:text-xl">
            Únete a miles de profesionales que ya confían en {APP_NAME} para gestionar sus proyectos de construcción.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth/register")} 
              variant="secondary" 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
            >
              Crear Cuenta Gratis
            </Button>
            <Button 
              onClick={() => navigate("/auth/login")} 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">{APP_NAME}</span>
              </div>
              <p className="text-gray-500 mb-4">
                {APP_SUBTITLE}
              </p>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-500 hover:text-primary">Características</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-primary">Precios</a></li>
                <li><a href="#faq" className="text-gray-500 hover:text-primary">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2">
                <li className="text-gray-500">Email: info@archub.com</li>
                <li className="text-gray-500">Teléfono: +54 11 1234-5678</li>
                <li className="text-gray-500">Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}