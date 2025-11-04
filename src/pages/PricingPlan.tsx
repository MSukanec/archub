import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

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
  const [enterprisePlan, setEnterprisePlan] = useState<Plan | null>(null);
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
        
        const mainPlans = (data || []).filter(p => 
          ['free', 'pro', 'teams'].includes(p.name.toLowerCase())
        );
        const enterprise = (data || []).find(p => p.name.toLowerCase() === 'enterprise');
        
        setPlans(mainPlans);
        setEnterprisePlan(enterprise || null);
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
      iconColor: string;
      cardHeader: string;
      description: string;
      features: string[];
      limits: { icon: string; value: string }[];
    }> = {
      'free': {
        iconColor: '#84cc16',
        cardHeader: 'Perfecto para comenzar',
        description: 'Para profesionales individuales y equipos pequeños',
        features: [
          'Gestión básica de proyectos',
          'Presupuestos y seguimiento',
          'Documentación de obra',
          'Resúmenes diarios con IA',
          'Dashboard de proyecto',
          'Soporte por email'
        ],
        limits: [
          { icon: '📁', value: '3 proyectos' },
          { icon: '💾', value: '500 MB' },
          { icon: '🤖', value: 'Solo resúmenes' },
          { icon: '👥', value: '1 usuario' }
        ]
      },
      'pro': {
        iconColor: '#0047AB',
        cardHeader: 'Para profesionales avanzados',
        description: 'Para equipos que necesitan funciones avanzadas',
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
          { icon: '📁', value: '50 proyectos' },
          { icon: '💾', value: '50 GB' },
          { icon: '🤖', value: '10,000 tokens/mes' },
          { icon: '👥', value: '1 usuario' }
        ]
      },
      'teams': {
        iconColor: '#8B5CF6',
        cardHeader: 'Para equipos colaborativos',
        description: 'Para organizaciones con múltiples usuarios',
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
          { icon: '📁', value: 'Ilimitados' },
          { icon: '💾', value: '500 GB' },
          { icon: '🤖', value: 'Ilimitados' },
          { icon: '👥', value: 'Ilimitados' }
        ]
      },
      'enterprise': {
        iconColor: '#64748b',
        cardHeader: 'Solución personalizada',
        description: 'Para grandes organizaciones con necesidades específicas',
        features: [
          'Todo en Teams',
          'Implementación on-premise',
          'SSO personalizado',
          'Capacitación incluida',
          'Gerente dedicado',
          'SLA 99.9%'
        ],
        limits: []
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
        
        {/* Banner Fundador - Con lista completa */}
        <Card className="border border-accent/20 bg-gradient-to-r from-background via-accent/[0.03] to-background">
          <div className="p-6 flex items-start gap-4">
            <div className="p-2.5 bg-accent/10 rounded-lg flex-shrink-0">
              <Crown className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-[var(--text-default)]">
                  Oferta de Lanzamiento: Conviértete en Fundador
                </h3>
                <Badge className="bg-accent text-accent-foreground text-xs">
                  Limitado
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Suscripción <strong>ANUAL</strong> incluye beneficios exclusivos de por vida:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span>Badge de "Fundador" en tu perfil</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span>Acceso anticipado a nuevas funcionalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span>Grupo privado de Fundadores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span>10% descuento en renovaciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span>20% descuento en suscripciones a cursos</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selector Mensual/Anual */}
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

        {/* Cards de Planes - EXACTAMENTE como referencia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const config = getPlanConfig(plan.name);
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
                    <Badge className="bg-accent text-accent-foreground text-[9px] font-bold px-3 py-1 uppercase">
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <div className="p-8 space-y-6">
                  {/* Header pequeño arriba */}
                  <div className={cn(
                    "text-xs leading-relaxed min-h-[36px]",
                    isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                  )}>
                    {config.cardHeader}
                  </div>

                  {/* Icono + Nombre del Plan */}
                  <div className="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill={config.iconColor} opacity="0.2"/>
                      <circle cx="12" cy="12" r="6" fill={config.iconColor}/>
                    </svg>
                    <h3 className={cn(
                      "text-2xl font-bold",
                      isPopular ? "text-white" : "text-[var(--text-default)]"
                    )}>
                      {plan.name}
                    </h3>
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
                        {monthlyPrice?.split('.')[0]}
                      </span>
                      <span className={cn(
                        "text-lg",
                        isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                      )}>
                        /mes
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <div className={cn(
                        "text-xs mt-1",
                        isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                      )}>
                        USD {totalPrice} al año
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
                      "w-full h-11 font-medium rounded-lg",
                      isPopular 
                        ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                        : ""
                    )}
                    variant={isPopular ? "default" : "secondary"}
                    data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
                  >
                    {billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'}
                  </Button>

                  {/* Límites */}
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

                  {/* Features */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                    )}>
                      {plan.name.toLowerCase() === 'free' ? 'Incluye' : `Todo en ${plan.name.toLowerCase() === 'pro' ? 'Free' : 'Pro'}, más:`}
                    </div>
                    <ul className="space-y-2.5">
                      {config.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0" style={{ color: config.iconColor }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
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

        {/* Enterprise Plan - Card horizontal completa */}
        {enterprisePlan && (
          <div className="max-w-6xl mx-auto">
            <Card className="border border-[var(--border-default)] overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                {/* Lado izquierdo */}
                <div className="flex-1 space-y-4">
                  <div className="text-xs text-[var(--text-muted)]">
                    {getPlanConfig('enterprise').cardHeader}
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="2" fill="#64748b" opacity="0.2"/>
                      <rect x="8" y="8" width="8" height="8" rx="1" fill="#64748b"/>
                    </svg>
                    <h3 className="text-2xl font-bold text-[var(--text-default)]">
                      Enterprise
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {getPlanConfig('enterprise').description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {getPlanConfig('enterprise').features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-[#64748b] flex-shrink-0" />
                        <span className="text-xs text-[var(--text-default)]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Lado derecho */}
                <div className="flex flex-col items-center gap-4 md:items-end">
                  <div className="text-center md:text-right">
                    <div className="text-3xl font-bold text-[var(--text-default)]">
                      Precio Personalizado
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Contactar a ventas
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="px-8"
                    data-testid="button-select-plan-enterprise"
                  >
                    Contactar ventas
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabla de Comparación - Con bordes y backgrounds */}
        <div className="mt-20 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-default)]">
            Comparación Detallada
          </h2>
          
          <div className="max-w-5xl mx-auto bg-card border border-[var(--border-default)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-0 bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="p-4 text-sm font-bold text-[var(--text-default)] uppercase tracking-wide border-r border-[var(--border-default)]">
                Característica
              </div>
              <div className="p-4 text-center text-sm font-bold text-[var(--text-default)] border-r border-[var(--border-default)]">
                Free
              </div>
              <div className="p-4 text-center text-sm font-bold text-[var(--text-default)] border-r border-[var(--border-default)]">
                Pro
              </div>
              <div className="p-4 text-center text-sm font-bold text-[var(--text-default)]">
                Teams
              </div>
            </div>

            {/* Gestión de Proyectos */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Gestión de Proyectos
                </h3>
              </div>
            </div>
            <TableRow label="Número de proyectos" values={['3', '50', 'Ilimitados']} />
            <TableRow label="Dashboard de proyecto" values={[true, true, true]} />
            <TableRow label="Vistas Gantt y Kanban" values={['Básicas', 'Avanzadas', 'Avanzadas']} />
            <TableRow label="Reportes de progreso" values={['Básicos', 'Avanzados', 'Avanzados + IA']} />

            {/* Gestión Financiera */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Gestión Financiera
                </h3>
              </div>
            </div>
            <TableRow label="Presupuestos" values={[true, true, true]} />
            <TableRow label="Multi-moneda (ARS, USD)" values={[false, true, true]} />
            <TableRow label="Control de gastos" values={['Básico', 'Avanzado', 'Avanzado']} />
            <TableRow label="Análisis de rentabilidad" values={[false, true, true]} />
            <TableRow label="Integraciones de pago" values={[false, true, true]} />

            {/* Construcción */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Construcción
                </h3>
              </div>
            </div>
            <TableRow label="Subcontratos" values={['Básico', 'Avanzado', 'Avanzado']} />
            <TableRow label="Personal" values={['Hasta 10', 'Hasta 100', 'Ilimitado']} />
            <TableRow label="Bitácora de obra" values={[true, true, true]} />

            {/* Almacenamiento */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Almacenamiento
                </h3>
              </div>
            </div>
            <TableRow label="Espacio de archivos" values={['500 MB', '50 GB', '500 GB']} />
            <TableRow label="PDFs personalizables" values={[false, true, true]} />
            <TableRow label="Backup automático" values={['Semanal', 'Diario', 'Cada 6hs']} />

            {/* IA */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Inteligencia Artificial
                </h3>
              </div>
            </div>
            <TableRow label="Tokens IA/mes" values={['Resúmenes', '10,000', 'Ilimitados']} />
            <TableRow label="Asistente conversacional" values={[false, true, true]} />
            <TableRow label="Análisis financiero IA" values={[false, true, true]} />

            {/* Colaboración */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Colaboración
                </h3>
              </div>
            </div>
            <TableRow label="Usuarios" values={['1', '1', 'Ilimitados']} />
            <TableRow label="Roles y permisos" values={[false, false, true]} />
            <TableRow label="Colaboración en tiempo real" values={[false, false, true]} />

            {/* Soporte */}
            <div className="bg-[var(--accent)]/5 border-b border-[var(--border-default)]">
              <div className="px-4 py-3">
                <h3 className="text-xs font-bold text-[var(--text-default)] uppercase tracking-wider">
                  Soporte
                </h3>
              </div>
            </div>
            <TableRow label="Email" values={[true, true, true]} />
            <TableRow label="Prioritario" values={[false, true, true]} />
            <TableRow label="24/7" values={[false, false, true]} last />
          </div>
        </div>

        {/* FAQ - Mejorado */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-[var(--text-default)]">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-3">
            {[
              {
                q: "¿Cómo funciona el periodo de prueba?",
                a: "14 días de prueba gratuita en todos los planes pagos. Sin necesidad de tarjeta."
              },
              {
                q: "¿Puedo cambiar de plan?",
                a: "Sí, puedes actualizar o degradar en cualquier momento. Los cambios se aplican inmediatamente."
              },
              {
                q: "¿Qué son los tokens de IA?",
                a: "Tokens para análisis financieros y consultas avanzadas. Pro incluye 10k mensuales, Teams tiene ilimitados."
              },
              {
                q: "¿Cómo obtengo el badge de Fundador?",
                a: "Con cualquier suscripción anual obtienes el badge permanente, acceso anticipado, grupo privado y descuentos."
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: "Tarjetas, Mercado Pago (ARG), PayPal, transferencias. Enterprise con facturación personalizada."
              },
              {
                q: "¿Qué pasa con mis datos si cancelo?",
                a: "Tus datos permanecen 90 días. Puedes reactivar sin pérdida o exportar antes de cancelar."
              }
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-card border border-[var(--border-default)] rounded-xl overflow-hidden"
              >
                <summary className="px-6 py-4 text-sm font-semibold text-[var(--text-default)] cursor-pointer hover:bg-[var(--accent)]/5 transition-colors list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <svg 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
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

function TableRow({ 
  label, 
  values,
  last = false
}: { 
  label: string; 
  values: (string | number | boolean)[];
  last?: boolean;
}) {
  return (
    <div className={cn(
      "grid grid-cols-4 gap-0",
      !last && "border-b border-[var(--border-default)]"
    )}>
      <div className="p-4 text-sm font-medium text-[var(--text-default)] border-r border-[var(--border-default)]">
        {label}
      </div>
      {values.map((value, idx) => (
        <div 
          key={idx} 
          className={cn(
            "p-4 flex justify-center items-center",
            idx < values.length - 1 && "border-r border-[var(--border-default)]"
          )}
        >
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
