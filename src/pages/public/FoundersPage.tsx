import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLayout } from "@/layouts";
import {
  Building2,
  GraduationCap,
  MessageSquare,
  FlaskConical,
  Users,
  Award,
  List,
  Crown,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  Star,
  Zap
} from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Beneficio Organizacional",
    description: "El estatus de Fundador aplica a toda tu Organización, no solo a ti. Todos los miembros de tu equipo heredan los beneficios automáticamente."
  },
  {
    icon: GraduationCap,
    title: "Acceso Vitalicio al Bonus de Capacitación",
    description: "Acceso gratuito y permanente al bonus de capacitación incluido en la suscripción. Actualmente: Curso completo de Archicad."
  },
  {
    icon: MessageSquare,
    title: "Voz y Voto en el Roadmap",
    description: "Canal directo con el equipo de desarrollo. Participa en votaciones para priorizar las funcionalidades que más te importan."
  },
  {
    icon: FlaskConical,
    title: "Acceso Anticipado (Modo Lab)",
    description: "Sé el primero en probar nuevas funcionalidades en modo beta antes de su lanzamiento oficial al público."
  },
  {
    icon: Users,
    title: "Comunidad Privada en Discord",
    description: "Acceso exclusivo a un canal privado donde conectar con otros fundadores, compartir experiencias y recibir soporte prioritario."
  },
  {
    icon: Award,
    title: "Insignia de Fundador Pública",
    description: "Una insignia visible en tu perfil que te identifica como miembro fundador de Seencel ante toda la comunidad."
  },
  {
    icon: List,
    title: "Listado de Organizaciones Fundadoras",
    description: "Tu organización será incluida en nuestro directorio público de fundadores, visible en la web de Seencel."
  },
  {
    icon: Crown,
    title: "Estatus Permanente",
    description: "Una vez fundador, siempre fundador. El estatus es vitalicio mientras mantengas tu suscripción activa."
  }
];

function HeroSection() {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mx-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/hero-founders-1080.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      data-testid="section-hero"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Subtle gradient overlay for visual interest */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(76, 100%, 40%) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, hsl(76, 80%, 30%) 0%, transparent 50%)`,
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="text-center max-w-4xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
          <Star className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-medium text-white">El Círculo Exclusivo de Seencel</span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8"
          style={{
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.022em'
          }}
        >
          Programa de Miembros Fundadores
        </h1>

        <p
          className="text-lg sm:text-xl mb-12 max-w-3xl mx-auto"
          style={{ color: '#b0b0b0', lineHeight: 1.6 }}
        >
          Únete a los pioneros que están dando forma al futuro de la gestión de la construcción y accede a beneficios vitalicios exclusivos.
        </p>

        <Link href="/register?plan=annual">
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-medium"
            data-testid="button-hero-cta"
          >
            Quiero ser Fundador
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function EssenceSection() {
  return (
    <section className="py-20 -mx-6 border-t" data-testid="section-essence">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              La Esencia
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            Una oportunidad única e irrepetible
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              El Programa de Miembros Fundadores es una <strong className="text-foreground">oferta de tiempo limitado</strong> diseñada para formar un grupo selecto de usuarios comprometidos que actuarán como asesores estratégicos del producto.
            </p>

            <p>
              Tu feedback directo nos ayudará a <strong className="text-foreground">acelerar el desarrollo</strong> y priorizar las funcionalidades que realmente importan a los profesionales de la construcción.
            </p>

            <p>
              A cambio de tu compromiso, recibirás <strong className="text-foreground">beneficios exclusivos vitalicios</strong> que nunca más estarán disponibles para nuevos usuarios.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-10 text-amber-500">
            <Clock className="h-5 w-5" />
            <span className="font-medium">El programa cerrará pronto</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="py-20 bg-card -mx-6" data-testid="section-benefits">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Beneficios Exclusivos
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
            8 beneficios únicos que solo los miembros fundadores disfrutarán
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group transition-all duration-200 hover:scale-105 border bg-background"
              data-testid={`card-benefit-${index + 1}`}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToJoinSection() {
  return (
    <section className="py-20 -mx-6" data-testid="section-how-to-join">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Cómo Unirse
            </h2>
            <p className="text-xl text-muted-foreground">
              El proceso es simple y directo
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-8 sm:p-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Suscripción Anual</h3>
                  <p className="text-muted-foreground">
                    El programa está disponible exclusivamente para usuarios con suscripción anual (Plan Pro o Teams). 
                    Al suscribirte anualmente, automáticamente te conviertes en miembro fundador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activación Inmediata</h3>
                  <p className="text-muted-foreground">
                    Una vez completada tu suscripción, todos los beneficios de fundador se activan automáticamente 
                    para ti y para toda tu organización.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Oferta por Tiempo Limitado</h3>
                  <p className="text-muted-foreground">
                    El programa de fundadores cerrará pronto y nunca volverá a abrirse. 
                    Esta es tu única oportunidad de asegurar estos beneficios vitalicios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section
      className="py-20 -mx-6"
      style={{
        background: 'linear-gradient(135deg, hsl(0, 0%, 8%) 0%, hsl(76, 30%, 12%) 50%, hsl(0, 0%, 10%) 100%)'
      }}
      data-testid="section-final-cta"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8"
            style={{ color: '#ffffff' }}
          >
            ¿Listo para ser parte de la historia de Seencel?
          </h2>

          <p
            className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto"
            style={{ color: '#b0b0b0' }}
          >
            Únete hoy al grupo exclusivo de fundadores y asegura beneficios vitalicios 
            mientras ayudas a construir el futuro de la gestión de proyectos de construcción.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/settings/plan?billing=annual">
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-medium"
                data-testid="button-final-cta"
              >
                Suscribirme al Plan Anual
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: '#808080' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Beneficios inmediatos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Estatus vitalicio</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Oferta exclusiva</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FoundersPage() {
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Inicio", href: "/" },
        { label: "Características", href: "/#features" },
        { label: "Cursos", href: "/cursos" },
        { label: "Contacto", href: "/contact" }
      ]}
      heroSlot={<HeroSection />}
      seo={{
        title: "Programa de Miembros Fundadores | Seencel",
        description: "Únete al círculo exclusivo de pioneros de Seencel. Accede a beneficios vitalicios, influye en el desarrollo del producto y forma parte de la historia de la gestión de construcción.",
        ogTitle: "Programa de Miembros Fundadores - Seencel",
        ogDescription: "Beneficios exclusivos vitalicios para los primeros usuarios comprometidos. Acceso anticipado, comunidad privada, insignia de fundador y más."
      }}
    >
      <EssenceSection />
      <BenefitsSection />
      <HowToJoinSection />
      <FinalCTASection />
    </MarketingLayout>
  );
}
