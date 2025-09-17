import { Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building, 
  Users, 
  FileText, 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Truck, 
  Shield,
  CheckCircle,
  ArrowRight,
  LogOut,
  Calculator,
  ClipboardList,
  Folder,
  PieChart
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const coreFeatures = [
  {
    icon: Building,
    title: "Gestión de Proyectos",
    description: "Administra proyectos de construcción con tareas parametrizadas, cronogramas y seguimiento de fases."
  },
  {
    icon: DollarSign,
    title: "Control Financiero",
    description: "Presupuestos detallados, movimientos, conversiones de moneda y gestión de costos en tiempo real."
  },
  {
    icon: Users,
    title: "Gestión de Equipos",
    description: "Organiza miembros, roles y asistencias. Múltiples organizaciones en una sola plataforma."
  },
  {
    icon: FileText,
    title: "Documentación Técnica",
    description: "Centraliza planos, especificaciones y documentos con sistema de versioning y organización jerárquica."
  },
  {
    icon: Truck,
    title: "Proveedores y Subcontratos",
    description: "Gestiona proveedores, productos, subcontratistas y sus tareas específicas."
  },
  {
    icon: BarChart3,
    title: "Análisis y Reportes",
    description: "Informes detallados de costos, rendimiento de tareas y análisis de productividad."
  }
];

const capabilities = [
  {
    category: "Planificación",
    features: [
      "Cronogramas interactivos tipo Gantt",
      "Tareas parametrizadas y configurables", 
      "Fases de construcción personalizables",
      "Calendario de actividades"
    ]
  },
  {
    category: "Control Financiero",
    features: [
      "Presupuestos detallados por partidas",
      "Seguimiento de costos reales vs planificados",
      "Conversiones automáticas de moneda",
      "Gestión de obligaciones y pagos"
    ]
  },
  {
    category: "Gestión Documental",
    features: [
      "Biblioteca de documentos técnicos",
      "Control de versiones",
      "Galería de imágenes del proyecto",
      "Exportación de reportes en PDF"
    ]
  },
  {
    category: "Administración",
    features: [
      "Base de datos de materiales y precios",
      "Gestión de contactos y clientes",
      "Roles y permisos granulares",
      "Múltiples organizaciones"
    ]
  }
];

export default function Landing() {
  const { user, loading, initialized, initialize, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized && !loading) {
      initialize();
    }
  }, [initialize, initialized, loading]);

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
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img 
                  src="/ArchubLogo.png" 
                  alt="Archub" 
                  className="h-8 w-8 object-contain"
                />
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
                  href="#capabilities" 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Capacidades
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {!loading && (
                user ? (
                  <div className="flex items-center space-x-3">
                    <Link href="/organization/dashboard">
                      <Button 
                        size="sm" 
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
                  <div className="flex items-center space-x-3">
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        size="sm" 
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
                        size="sm" 
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
            La plataforma completa para administrar{" "}
            <span style={{ color: 'var(--accent)' }}>
              proyectos de construcción
            </span>
          </h1>
          
          <p className="text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Controla presupuestos, coordina equipos, gestiona documentos y supervisa el progreso 
            de tus obras en tiempo real. Desde el planning hasta la entrega final.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-medium"
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
          </div>

          {/* Real Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12" style={{ borderTop: '1px solid var(--layout-border)' }}>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="font-semibold">Setup en minutos</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Onboarding guiado para empezar rápidamente
              </div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="font-semibold">Datos seguros</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Respaldos automáticos y acceso controlado
              </div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="font-semibold">Multi-organización</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Gestiona múltiples empresas desde una cuenta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Funcionalidades principales
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Todo lo que necesitas para llevar tus proyectos del concepto a la realidad
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--layout-bg)', 
                  border: '1px solid var(--card-border)' 
                }}
              >
                <div className="mb-6">
                  <feature.icon 
                    className="h-12 w-12 group-hover:scale-110 transition-transform duration-200" 
                    style={{ color: 'var(--accent)' }} 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-default)' }}>
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

      {/* Detailed Capabilities */}
      <section id="capabilities" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Capacidades detalladas
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Herramientas especializadas para cada aspecto de la gestión constructiva
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)' 
                }}
              >
                <h3 className="text-lg font-semibold mb-4 pb-2" style={{ 
                  color: 'var(--accent)',
                  borderBottom: '2px solid var(--accent)'
                }}>
                  {capability.category}
                </h3>
                <ul className="space-y-3">
                  {capability.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Cómo funciona
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Desde la configuración inicial hasta la gestión diaria de tus proyectos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--accent)' }}>
                <ClipboardList className="h-8 w-8" style={{ color: 'var(--accent-text)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Configura tu organización</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Crea tu perfil, configura miembros del equipo y establece los parámetros básicos de tu empresa constructora.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--accent)' }}>
                <Folder className="h-8 w-8" style={{ color: 'var(--accent-text)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Crea y planifica proyectos</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Define proyectos con presupuestos detallados, cronogramas, tareas parametrizadas y documentación técnica.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--accent)' }}>
                <PieChart className="h-8 w-8" style={{ color: 'var(--accent-text)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Gestiona y supervisa</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Monitorea el progreso en tiempo real, controla costos, gestiona equipos y genera reportes detallados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Comienza a gestionar tus proyectos profesionalmente
            </h2>
            <p className="text-xl mb-12" style={{ color: 'var(--text-muted)' }}>
              Registra tu cuenta gratuita y configura tu primer proyecto en minutos
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg font-medium"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--accent-text)',
                    border: 'none'
                  }}
                >
                  Crear Cuenta Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin compromisos • Configuración inmediata
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
              © 2025 Archub. Plataforma de gestión para la construcción.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}