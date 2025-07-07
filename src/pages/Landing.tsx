import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building, Users, FileText, BarChart3, Shield, Zap, CheckCircle, ArrowRight, Star } from "lucide-react";

const features = [
  {
    icon: Building,
    title: "Gestión de Proyectos",
    description: "Administra todos tus proyectos de construcción desde un solo lugar con herramientas inteligentes"
  },
  {
    icon: Users,
    title: "Colaboración en Tiempo Real",
    description: "Coordina equipos y mantén a todos sincronizados con actualizaciones instantáneas"
  },
  {
    icon: FileText,
    title: "Documentación Técnica",
    description: "Organiza planos, especificaciones y documentos importantes de forma centralizada"
  },
  {
    icon: BarChart3,
    title: "Análisis y Reportes",
    description: "Obtén insights valiosos sobre el progreso de tus proyectos con dashboards intuitivos"
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus datos están protegidos con los más altos estándares de seguridad empresarial"
  },
  {
    icon: Zap,
    title: "Rápido y Eficiente",
    description: "Interfaz optimizada para maximizar tu productividad y reducir tiempos de gestión"
  }
];

const stats = [
  { value: "10,000+", label: "Proyectos gestionados" },
  { value: "500+", label: "Empresas confían en nosotros" },
  { value: "99.9%", label: "Tiempo de actividad" },
  { value: "24/7", label: "Soporte disponible" }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-xl font-bold">Archub</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Características</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precios</a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-accent-foreground">
                  Comenzar Gratis
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-1 mb-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">Calificado 5/5 por más de 500 empresas</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            La plataforma de gestión{" "}
            <span className="text-[var(--accent)]">más avanzada</span>{" "}
            para construcción
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Optimiza cada etapa de tu construcción con herramientas inteligentes de planificación, 
            presupuestos y seguimiento en tiempo real.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-accent-foreground px-8 py-3">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Ver Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border/40">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para gestionar construcción
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una suite completa de herramientas diseñadas específicamente para la industria de la construcción
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 rounded-lg bg-card border border-border hover:border-[var(--accent)]/50 transition-all duration-200">
                <div className="mb-4">
                  <feature.icon className="h-8 w-8 text-[var(--accent)] group-hover:scale-110 transition-transform duration-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comienza a gestionar tus proyectos hoy mismo
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Únete a miles de empresas que ya optimizan sus procesos constructivos con Archub
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-accent-foreground px-8 py-3">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">Sin tarjeta de crédito requerida</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6 text-[var(--accent)]" />
              <span className="font-bold">Archub</span>
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