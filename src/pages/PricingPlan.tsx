import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, Sparkles, Users, Briefcase, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: any;
  billing_type: string;
}

type BillingPeriod = 'monthly' | 'annual';

export default function PricingPlan() {
  const { setSidebarLevel } = useNavigationStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true, nullsFirst: true });

        if (error) throw error;
        
        // Filtrar solo Free, Pro, Teams (sin Enterprise para las cards)
        const filteredPlans = (data || []).filter(p => 
          ['free', 'pro', 'teams'].includes(p.name.toLowerCase())
        );
        setPlans(filteredPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPlanPrice = (price: number | null) => {
    if (!price) return null;
    if (billingPeriod === 'annual') {
      return (price * 12 * 0.8).toFixed(2);
    }
    return price.toFixed(2);
  };

  const getMonthlyEquivalent = (price: number | null) => {
    if (!price) return null;
    if (billingPeriod === 'annual') {
      return (price * 0.8).toFixed(2);
    }
    return price.toFixed(2);
  };

  const getPlanConfig = (planName: string) => {
    const configs: Record<string, { 
      icon: any; 
      iconColor: string;
      iconBg: string;
      description: string;
      features: string[];
      limits: { icon: string; label: string; value: string }[];
    }> = {
      'free': {
        icon: Sparkles,
        iconColor: 'text-[#84cc16]',
        iconBg: 'bg-[#84cc16]/10',
        description: 'Perfecto para comenzar',
        features: [
          'Gestión básica de proyectos',
          'Presupuestos y seguimiento',
          'Documentación de obra',
          'Resúmenes diarios con IA',
          'Dashboard de proyecto'
        ],
        limits: [
          { icon: '📁', label: '3 proyectos', value: '3 proyectos' },
          { icon: '💾', label: '500 MB', value: '500 MB' },
          { icon: '🤖', label: 'Solo resúmenes', value: 'Solo resúmenes' },
          { icon: '👥', label: '1 usuario', value: '1 usuario' }
        ]
      },
      'pro': {
        icon: Zap,
        iconColor: 'text-[#0047AB]',
        iconBg: 'bg-[#0047AB]/10',
        description: 'Para profesionales avanzados',
        features: [
          'Todo en Free',
          'Gestión multi-moneda',
          'PDFs personalizables',
          '10,000 tokens IA/mes',
          'Control de subcontratos',
          'Gestión de personal',
          'Gantt y Kanban avanzados',
          'Integraciones de pago',
          'Soporte prioritario'
        ],
        limits: [
          { icon: '📁', label: '50 proyectos', value: '50 proyectos' },
          { icon: '💾', label: '50 GB', value: '50 GB' },
          { icon: '🤖', label: '10,000 tokens/mes', value: '10,000 tokens/mes' },
          { icon: '👥', label: '1 usuario', value: '1 usuario' }
        ]
      },
      'teams': {
        icon: Users,
        iconColor: 'text-[#8B5CF6]',
        iconBg: 'bg-[#8B5CF6]/10',
        description: 'Para equipos colaborativos',
        features: [
          'Todo en Pro',
          'Usuarios ilimitados',
          'IA ilimitada',
          'Colaboración en tiempo real',
          'Historial de cambios',
          'Admin de equipo',
          'Múltiples organizaciones',
          'API de integración',
          'Soporte 24/7'
        ],
        limits: [
          { icon: '📁', label: 'Ilimitados', value: 'Ilimitados' },
          { icon: '💾', label: '500 GB', value: '500 GB' },
          { icon: '🤖', label: 'Tokens ilimitados', value: 'Ilimitados' },
          { icon: '👥', label: 'Ilimitados', value: 'Ilimitados' }
        ]
      }
    };

    return configs[planName.toLowerCase()] || configs['free'];
  };

  const headerProps = {
    icon: CreditCard,
    title: "Planes y Precios",
    description: "Elige el plan que mejor se adapte a tus necesidades"
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
        
        {/* Banner Fundador - Ultra Minimalista */}
        <Card className="border border-accent/20 bg-gradient-to-r from-background via-accent/[0.02] to-background shadow-sm">
          <div className="p-5 flex items-center gap-4">
            <div className="p-2 bg-accent/10 rounded-md">
              <Crown className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--text-default)]">
                  Oferta de Lanzamiento: Conviértete en Fundador
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-3">
                  Suscripción anual con beneficios exclusivos de por vida
                </span>
              </div>
              <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5">
                Limitado
              </Badge>
            </div>
          </div>
        </Card>

        {/* Selector Mensual/Anual - Estilo Premium */}
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-card rounded-xl p-1.5 shadow-sm border border-[var(--border-default)]">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                "px-8 py-2.5 rounded-lg font-medium transition-all text-sm",
                billingPeriod === 'monthly'
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
              )}
              data-testid="button-billing-monthly"
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                "px-8 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2.5",
                billingPeriod === 'annual'
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
              )}
              data-testid="button-billing-annual"
            >
              <span>Anual</span>
              <span className="text-xs font-bold bg-accent-foreground/20 px-2 py-0.5 rounded">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards de Planes - Diseño Premium Inspirado en Referencias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const config = getPlanConfig(plan.name);
            const Icon = config.icon;
            const monthlyPrice = getMonthlyEquivalent(plan.price);
            const totalPrice = getPlanPrice(plan.price);
            const isPopular = plan.name.toLowerCase() === 'pro';

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl overflow-hidden transition-all duration-300",
                  isPopular 
                    ? "bg-[#1a1a1a] dark:bg-[#1a1a1a] text-white scale-105 shadow-2xl" 
                    : "bg-card border border-[var(--border-default)] hover:shadow-lg"
                )}
              >
                {isPopular && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-accent text-accent-foreground text-[9px] font-bold px-3 py-1">
                      MÁS POPULAR
                    </Badge>
                  </div>
                )}
                
                <div className="p-8 space-y-6">
                  {/* Header con Icono Grande */}
                  <div className="space-y-4">
                    <div 
                      className={cn(
                        "inline-flex p-3 rounded-xl",
                        config.iconBg
                      )}
                    >
                      <Icon className={cn("h-7 w-7", config.iconColor)} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-2xl font-bold mb-2",
                        isPopular ? "text-white" : "text-[var(--text-default)]"
                      )}>
                        {plan.name}
                      </h3>
                      <p className={cn(
                        "text-sm",
                        isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                      )}>
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-sm",
                        isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                      )}>
                        USD
                      </span>
                      <span className={cn(
                        "text-5xl font-bold tracking-tight",
                        isPopular ? "text-white" : "text-[var(--text-default)]"
                      )}>
                        {plan.price === null ? '—' : monthlyPrice?.split('.')[0]}
                      </span>
                      {plan.price !== null && (
                        <span className={cn(
                          "text-lg",
                          isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                        )}>
                          /mes
                        </span>
                      )}
                    </div>
                    {billingPeriod === 'annual' && plan.price !== null && (
                      <div className={cn(
                        "text-xs mt-1",
                        isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                      )}>
                        USD {totalPrice} facturado anualmente
                      </div>
                    )}
                    {plan.billing_type === 'per_user' && plan.name.toLowerCase() === 'teams' && (
                      <div className={cn(
                        "text-xs mt-0.5",
                        isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                      )}>
                        Por usuario/asiento
                      </div>
                    )}
                  </div>

                  {/* Botón CTA */}
                  <Button
                    className={cn(
                      "w-full h-11 font-medium",
                      isPopular 
                        ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                        : ""
                    )}
                    variant={isPopular ? "default" : "secondary"}
                    data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
                  >
                    {billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'}
                  </Button>

                  {/* Límites con Iconos */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                    )}>
                      Límites
                    </div>
                    <div className="space-y-2.5">
                      {config.limits.map((limit, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-base opacity-70">{limit.icon}</span>
                          <span className={cn(
                            "text-sm",
                            isPopular ? "text-gray-300" : "text-[var(--text-default)]"
                          )}>
                            {limit.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features con Checks */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                    )}>
                      Incluye
                    </div>
                    <ul className="space-y-2.5">
                      {config.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            isPopular ? "text-accent" : config.iconColor
                          )} />
                          <span className={cn(
                            "text-sm leading-snug",
                            isPopular ? "text-gray-300" : "text-[var(--text-default)]"
                          )}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabla Personalizada - Diseño Minimalista */}
        <div className="mt-20 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-default)]">
            Comparación Detallada
          </h2>
          
          <div className="max-w-5xl mx-auto">
            {/* Header de la tabla */}
            <div className="grid grid-cols-4 gap-4 mb-1">
              <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Característica
              </div>
              <div className="text-center text-sm font-semibold text-[var(--text-default)]">
                Free
              </div>
              <div className="text-center text-sm font-semibold text-[var(--text-default)]">
                Pro
              </div>
              <div className="text-center text-sm font-semibold text-[var(--text-default)]">
                Teams
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-8 mt-8">
              {/* Gestión de Proyectos */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Gestión de Proyectos
                  </h3>
                </div>
                <ComparisonRow label="Número de proyectos" values={['3', '50', 'Ilimitados']} />
                <ComparisonRow label="Dashboard de proyecto" values={[true, true, true]} />
                <ComparisonRow label="Vistas Gantt y Kanban" values={['Básicas', 'Avanzadas', 'Avanzadas']} />
                <ComparisonRow label="Reportes de progreso" values={['Básicos', 'Avanzados', 'Avanzados + IA']} />
              </div>

              {/* Gestión Financiera */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Gestión Financiera
                  </h3>
                </div>
                <ComparisonRow label="Presupuestos" values={[true, true, true]} />
                <ComparisonRow label="Multi-moneda (ARS, USD)" values={[false, true, true]} />
                <ComparisonRow label="Control de gastos" values={['Básico', 'Avanzado', 'Avanzado']} />
                <ComparisonRow label="Análisis de rentabilidad" values={[false, true, true]} />
                <ComparisonRow label="Integraciones de pago" values={[false, true, true]} />
              </div>

              {/* Construcción */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Construcción
                  </h3>
                </div>
                <ComparisonRow label="Subcontratos" values={['Básico', 'Avanzado', 'Avanzado']} />
                <ComparisonRow label="Personal" values={['Hasta 10', 'Hasta 100', 'Ilimitado']} />
                <ComparisonRow label="Bitácora de obra" values={[true, true, true]} />
              </div>

              {/* Almacenamiento */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Almacenamiento
                  </h3>
                </div>
                <ComparisonRow label="Espacio de archivos" values={['500 MB', '50 GB', '500 GB']} />
                <ComparisonRow label="PDFs personalizables" values={[false, true, true]} />
                <ComparisonRow label="Backup automático" values={['Semanal', 'Diario', 'Cada 6hs']} />
              </div>

              {/* IA */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Inteligencia Artificial
                  </h3>
                </div>
                <ComparisonRow label="Tokens IA/mes" values={['Resúmenes', '10,000', 'Ilimitados']} />
                <ComparisonRow label="Asistente conversacional" values={[false, true, true]} />
                <ComparisonRow label="Análisis financiero IA" values={[false, true, true]} />
              </div>

              {/* Colaboración */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Colaboración
                  </h3>
                </div>
                <ComparisonRow label="Usuarios" values={['1', '1', 'Ilimitados']} />
                <ComparisonRow label="Roles y permisos" values={[false, false, true]} />
                <ComparisonRow label="Colaboración en tiempo real" values={[false, false, true]} />
              </div>

              {/* Soporte */}
              <div className="space-y-1">
                <div className="bg-[var(--accent)]/10 px-4 py-2.5 rounded-lg">
                  <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                    Soporte
                  </h3>
                </div>
                <ComparisonRow label="Email" values={[true, true, true]} />
                <ComparisonRow label="Prioritario" values={[false, true, true]} />
                <ComparisonRow label="24/7" values={[false, false, true]} />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-[var(--text-default)]">
            Preguntas Frecuentes
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-card border border-[var(--border-default)] rounded-xl px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Cómo funciona el periodo de prueba?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--text-muted)] leading-relaxed">
                14 días de prueba gratuita en todos los planes pagos. Sin necesidad de tarjeta.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-[var(--border-default)] rounded-xl px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Puedo cambiar de plan?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--text-muted)] leading-relaxed">
                Sí, puedes actualizar o degradar en cualquier momento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-[var(--border-default)] rounded-xl px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Qué son los tokens de IA?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--text-muted)] leading-relaxed">
                Tokens para análisis financieros y consultas avanzadas. Pro incluye 10k mensuales, Teams tiene ilimitados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-[var(--border-default)] rounded-xl px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Cómo obtengo el badge de Fundador?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--text-muted)] leading-relaxed">
                Con cualquier suscripción anual obtienes el badge permanente y beneficios exclusivos.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Final */}
        <Card className="mt-20 bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 border-2 border-accent/20 rounded-2xl">
          <div className="p-12 text-center space-y-6">
            <h3 className="text-3xl font-bold text-[var(--text-default)]">
              ¿Listo para transformar tu gestión?
            </h3>
            <p className="text-base text-[var(--text-muted)] max-w-2xl mx-auto">
              Únete a cientos de profesionales optimizando sus proyectos con Archub.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <Button 
                size="lg"
                variant="default"
                data-testid="button-cta-trial"
              >
                Comenzar prueba gratuita
              </Button>
              <Button 
                size="lg"
                variant="secondary"
                data-testid="button-cta-contact"
              >
                Hablar con ventas
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function ComparisonRow({ 
  label, 
  values 
}: { 
  label: string; 
  values: (string | number | boolean)[] 
}) {
  return (
    <div className="grid grid-cols-4 gap-4 py-3.5 px-4 hover:bg-[var(--accent)]/5 rounded-lg transition-colors">
      <div className="text-sm text-[var(--text-default)] font-medium">
        {label}
      </div>
      {values.map((value, idx) => (
        <div key={idx} className="flex justify-center items-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="h-5 w-5 text-accent" />
            ) : (
              <X className="h-4 w-4 text-gray-300 dark:text-gray-700" />
            )
          ) : (
            <span className="text-sm text-[var(--text-default)]">{value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
