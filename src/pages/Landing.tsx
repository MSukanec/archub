import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, FileText, BarChart3, Shield, Zap, CheckCircle, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Building,
    title: "Gestión de Proyectos",
    description: "Administra todos tus proyectos de construcción desde un solo lugar"
  },
  {
    icon: Users,
    title: "Colaboración en Tiempo Real",
    description: "Coordina equipos y mantén a todos sincronizados"
  },
  {
    icon: FileText,
    title: "Documentación Técnica",
    description: "Organiza planos, especificaciones y documentos importantes"
  },
  {
    icon: BarChart3,
    title: "Análisis y Reportes",
    description: "Obtén insights valiosos sobre el progreso de tus proyectos"
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus datos están protegidos con los más altos estándares de seguridad"
  },
  {
    icon: Zap,
    title: "Rápido y Eficiente",
    description: "Interfaz optimizada para maximizar tu productividad"
  }
];

const benefits = [
  "Reduce tiempo de gestión en un 60%",
  "Mejora la comunicación del equipo",
  "Centraliza toda la información del proyecto",
  "Genera reportes automáticos",
  "Acceso desde cualquier dispositivo"
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Archub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            La plataforma de gestión de construcción
            <span className="text-blue-600 block">más completa</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Gestiona proyectos, equipos y presupuestos de construcción de manera inteligente. 
            Centraliza toda tu información y mejora la productividad de tu equipo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8 py-4 text-lg">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Todo lo que necesitas para gestionar tus proyectos
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Archub combina todas las herramientas esenciales en una plataforma integrada
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-blue-600 dark:bg-blue-700 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Transforma la manera de gestionar tus proyectos
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Miles de profesionales de la construcción ya confían en Archub para 
                optimizar sus procesos y aumentar su rentabilidad.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-green-300 mr-3 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <Card className="inline-block p-8 bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-white text-2xl mb-2">
                    Comienza hoy mismo
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Regístrate gratis y transforma tu gestión de proyectos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/register">
                    <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-slate-100">
                      Crear Cuenta Gratis
                    </Button>
                  </Link>
                  <p className="text-blue-100 text-sm mt-4">
                    Sin tarjeta de crédito. Sin compromisos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-semibold text-white">Archub</span>
            </div>
            <p className="text-slate-400">
              © 2025 Archub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}