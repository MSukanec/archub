import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
  Calculator,
  ClipboardList,
  Folder,
  PieChart,
  Sparkles,
  GraduationCap,
  Zap,
  Package
} from "lucide-react";
import { MarketingLayout } from "@/layouts";

const coreFeatures = [
  {
    icon: Sparkles,
    title: "Asistente IA Integrado",
    description: "Copilot inteligente que analiza tus finanzas, responde consultas y te ayuda a tomar decisiones informadas sobre tus proyectos."
  },
  {
    icon: Building,
    title: "Ciclo Completo de Proyectos",
    description: "Gestiona diseño, planificación, ventas, marketing, construcción y entrega. Todo el ciclo en una sola plataforma."
  },
  {
    icon: DollarSign,
    title: "Control Financiero Avanzado",
    description: "Presupuestos detallados, análisis de flujo de caja, multi-moneda y reportes financieros con IA."
  },
  {
    icon: GraduationCap,
    title: "Capacitación Continua",
    description: "Accede a cursos especializados, recursos técnicos y contenido educativo para profesionales de la construcción."
  },
  {
    icon: FileText,
    title: "Documentación Técnica",
    description: "Centraliza planos, especificaciones, contratos y documentos con sistema de versioning profesional."
  },
  {
    icon: Zap,
    title: "Integraciones",
    description: "Conecta con las herramientas que ya usas. Integraciones con software de diseño, contabilidad y más."
  }
];

const capabilities = [
  {
    category: "Inteligencia Artificial",
    features: [
      "Análisis financiero automático",
      "Consultas en lenguaje natural",
      "Insights y recomendaciones",
      "Predicciones de flujo de caja"
    ]
  },
  {
    category: "Diseño & Planificación",
    features: [
      "Gestión de etapa de diseño",
      "Cronogramas tipo Gantt",
      "Presupuestos paramétricos",
      "Biblioteca de documentos técnicos"
    ]
  },
  {
    category: "Ventas & Marketing",
    features: [
      "CRM de clientes potenciales",
      "Seguimiento de oportunidades",
      "Cotizaciones profesionales",
      "Pipeline de ventas"
    ]
  },
  {
    category: "Construcción",
    features: [
      "Control de obra en tiempo real",
      "Gestión de subcontratistas",
      "Asistencias de personal",
      "Fotografías de avance"
    ]
  },
  {
    category: "Finanzas",
    features: [
      "Multi-moneda automática",
      "Análisis de costos reales vs planificados",
      "Gestión de pagos y cobranzas",
      "Reportes financieros detallados"
    ]
  },
  {
    category: "Capacitación",
    features: [
      "Cursos especializados",
      "Videos y lecciones interactivas",
      "Certificados profesionales",
      "Recursos descargables"
    ]
  },
  {
    category: "Integraciones",
    features: [
      "API abierta para desarrolladores",
      "Conexión con software de diseño",
      "Integración con contabilidad",
      "Webhooks y automatizaciones"
    ]
  },
  {
    category: "Administración",
    features: [
      "Multi-organización",
      "Roles y permisos granulares",
      "Base de datos centralizada",
      "Respaldos automáticos"
    ]
  }
];

// Hero Section Component
function HeroSectionComponent() {
  return (
    <section 
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mx-6 relative"
      style={{
        backgroundImage: 'url(/hero-landing-1080.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="text-center max-w-5xl mx-auto relative z-10">
        <h1 
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight"
          style={{ color: '#ffffff' }}
        >
          La plataforma integral para arquitectura y construcción
        </h1>
        
        <p className="text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{ color: '#b3b3b3' }}>
          Gestiona todo el ciclo de vida de tus proyectos: desde diseño y planificación, 
          pasando por ventas y marketing, hasta construcción y entrega. Con IA integrada, 
          capacitación continua y conexión con las herramientas que ya usas.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8 py-4 text-lg font-medium">
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Características", href: "#features" },
        { label: "Capacidades", href: "#capabilities" },
        { label: "Contacto", href: "/contact" }
      ]}
      heroSlot={<HeroSectionComponent />}
    >
      {/* Real Benefits Section - Now after hero */}
      <section className="py-20 -mx-6 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="font-semibold">Setup en minutos</div>
              <div className="text-sm text-muted-foreground">
                Onboarding guiado para empezar rápidamente
              </div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="font-semibold">Datos seguros</div>
              <div className="text-sm text-muted-foreground">
                Respaldos automáticos y acceso controlado
              </div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="font-semibold">Multi-organización</div>
              <div className="text-sm text-muted-foreground">
                Gestiona múltiples empresas desde una cuenta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-card -mx-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Herramientas de última generación
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              IA, capacitación, integraciones y gestión completa del ciclo de vida de tus proyectos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-lg transition-all duration-200 hover:scale-105 bg-background border"
              >
                <div className="mb-6">
                  <feature.icon 
                    className="h-12 w-12 group-hover:scale-110 transition-transform duration-200 text-primary" 
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Capabilities */}
      <section id="capabilities" className="py-20 -mx-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Potencia completa para profesionales
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Desde diseño hasta entrega, pasando por ventas y construcción. Todo en un solo lugar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg bg-card border"
              >
                <h3 className="text-lg font-semibold mb-4 pb-2 text-primary border-b-2 border-primary">
                  {capability.category}
                </h3>
                <ul className="space-y-3">
                  {capability.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-3 flex-shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
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
      <section className="py-20 bg-card -mx-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Cómo funciona
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
              Desde la configuración inicial hasta la gestión diaria de tus proyectos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-primary">
                <ClipboardList className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Configura tu organización</h3>
              <p className="text-muted-foreground">
                Crea tu perfil, agrega miembros del equipo y configura tu espacio de trabajo en minutos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-primary">
                <Folder className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Gestiona todo el ciclo</h3>
              <p className="text-muted-foreground">
                Desde diseño y ventas, hasta construcción y entrega. Presupuestos, cronogramas, equipos y documentación técnica.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-primary">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Potencia con IA</h3>
              <p className="text-muted-foreground">
                Tu copilot inteligente analiza finanzas, responde consultas y te ayuda a tomar mejores decisiones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 -mx-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Lleva tus proyectos al siguiente nivel
            </h2>
            <p className="text-xl mb-12 text-muted-foreground">
              Únete a profesionales que ya transforman su forma de trabajar con IA, capacitación e integraciones
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 text-lg font-medium">
                  Crear Cuenta Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                Sin compromisos • Configuración inmediata
              </span>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}