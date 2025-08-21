import { Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Users, FileText, BarChart3, Shield, Zap, Star, ArrowRight, Github, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

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
  const { user, loading, initialized, initialize, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email || "Usuario";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen dark" style={{ 
      backgroundColor: 'var(--layout-bg)', 
      color: 'var(--text-default)' 
    }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--layout-border)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y navegación izquierda */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8" style={{ color: 'var(--accent)' }} />
                <span className="text-xl font-bold">Archub</span>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <a 
                  href="#features" 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Características
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Precios
                </a>
                <a 
                  href="#contact" 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Contacto
                </a>
              </nav>
            </div>

            {/* Navegación derecha */}
            <div className="flex items-center space-x-4">
              {!loading && (
                user ? (
                  // Usuario autenticado
                  <div className="flex items-center space-x-3">
                    <Link href="/dashboard">
                      <Button 
                        size="icon-sm" 
                        className="h-8 px-3"
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          color: 'var(--accent-text)',
                          border: 'none'
                        }}
                      >
                        Dashboard
                      </Button>
                    </Link>

                    <div className="flex items-center space-x-2 group relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback 
                          className="text-xs"
                          style={{ 
                            backgroundColor: 'var(--card-bg)', 
                            color: 'var(--text-default)' 
                          }}
                        >
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Dropdown menu oculto por ahora, se puede implementar después */}
                      <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-48 py-2 rounded-md shadow-lg z-50"
                           style={{ 
                             backgroundColor: 'var(--popover-bg)', 
                             border: '1px solid var(--layout-border)' 
                           }}>
                        <button
                          onClick={logout}
                          className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80"
                          style={{ color: 'var(--text-default)' }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Usuario no autenticado
                  <div className="flex items-center space-x-3">
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="h-8 px-3"
                        style={{ 
                          backgroundColor: 'var(--button-ghost-bg)',
                          color: 'var(--button-ghost-text)',
                          border: 'none'
                        }}
                      >
                        Iniciar Sesión
                      </Button>
                    </Link>
                    
                    <Link href="/register">
                      <Button 
                        size="icon-sm" 
                        className="h-8 px-3"
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          color: 'var(--accent-text)',
                          border: 'none'
                        }}
                      >
                        Comenzar Gratis
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4" style={{ 
                  fill: 'var(--accent)', 
                  color: 'var(--accent)' 
                }} />
              ))}
            </div>
            <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
              Calificado 5/5 por más de 500 empresas
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Gestiona tus proyectos de{" "}
            <span style={{ color: 'var(--accent)' }}>
              construcción
            </span>
            {" "}de forma inteligente
          </h1>
          
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            La plataforma completa para administrar proyectos de construcción. 
            Controla presupuestos, coordina equipos, gestiona documentos y 
            supervisa el progreso de tus obras en tiempo real.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register">
              <Button 
                size="lg" 
                className="px-8 py-3 text-base font-medium"
                style={{ 
                  backgroundColor: 'var(--accent)', 
                  color: 'var(--accent-text)',
                  border: 'none'
                }}
              >
                Comenzar Gratis
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-base font-medium"
              style={{ 
                backgroundColor: 'var(--button-secondary-bg)', 
                color: 'var(--button-secondary-text)',
                border: '1px solid var(--layout-border)'
              }}
            >
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12" style={{ borderTop: '1px solid var(--layout-border)' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stat.value}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Todo lo que necesitas para gestionar construcción
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Una suite completa de herramientas diseñadas específicamente para la industria de la construcción
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)' 
                }}
              >
                <div className="mb-6">
                  <feature.icon 
                    className="h-10 w-10 group-hover:scale-110 transition-transform duration-200" 
                    style={{ color: 'var(--accent)' }} 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-default)' }}>
                  {feature.title}
                </h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Comienza a gestionar tus proyectos hoy mismo
            </h2>
            <p className="text-xl mb-12" style={{ color: 'var(--text-muted)' }}>
              Únete a miles de empresas que ya optimizan sus procesos constructivos con Archub
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="px-8 py-3 text-base font-medium"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--accent-text)',
                    border: 'none'
                  }}
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin tarjeta de crédito requerida
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ borderTop: '1px solid var(--layout-border)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              <span className="font-bold">Archub</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © 2025 Archub. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}