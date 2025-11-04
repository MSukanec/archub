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
        setPlans(data || []);
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
      color: string;
      description: string;
      features: string[];
      limits: { projects: string; storage: string; ai: string; users: string };
    }> = {
      'free': {
        icon: Sparkles,
        color: 'hsl(76, 100%, 40%)',
        description: 'Perfecto para comenzar',
        features: [
          'Gestión básica de proyectos',
          'Presupuestos y seguimiento',
          'Documentación de obra',
          'Resúmenes diarios con IA',
          'Dashboard de proyecto',
          'Soporte por email'
        ],
        limits: {
          projects: '3 proyectos',
          storage: '500 MB',
          ai: 'Solo resúmenes',
          users: '1 usuario'
        }
      },
      'pro': {
        icon: Zap,
        color: 'hsl(213, 100%, 33%)',
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
        limits: {
          projects: '50 proyectos',
          storage: '50 GB',
          ai: '10,000 tokens/mes',
          users: '1 usuario'
        }
      },
      'teams': {
        icon: Users,
        color: 'hsl(271, 76%, 53%)',
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
        limits: {
          projects: 'Ilimitados',
          storage: '500 GB',
          ai: 'Tokens ilimitados',
          users: 'Ilimitados'
        }
      },
      'enterprise': {
        icon: Briefcase,
        color: 'hsl(240, 5%, 35%)',
        description: 'Solución personalizada',
        features: [
          'Todo en Teams',
          'Implementación on-premise',
          'SSO personalizado',
          'Cumplimiento normativo',
          'Capacitación incluida',
          'Gerente dedicado',
          'SLA 99.9%',
          'Desarrollo a medida',
          'Integraciones custom'
        ],
        limits: {
          projects: 'Sin límites',
          storage: 'Personalizado',
          ai: 'Sin límites',
          users: 'Sin límites'
        }
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
      <div className="max-w-7xl mx-auto space-y-12 py-8">
        
        {/* Banner Fundador - Minimalista con --accent */}
        <Card className="border-2 border-accent/20 bg-gradient-to-br from-background via-background to-accent/5">
          <div className="p-6 flex items-start gap-4">
            <div className="p-2.5 bg-accent/10 rounded-lg">
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
              </div>
            </div>
          </div>
        </Card>

        {/* Toggle Mensual/Anual */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              "px-6 py-2.5 rounded-lg font-medium transition-all text-sm",
              billingPeriod === 'monthly'
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-[var(--text-muted)] hover:bg-card-hover"
            )}
            data-testid="button-billing-monthly"
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              "px-6 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
              billingPeriod === 'annual'
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-[var(--text-muted)] hover:bg-card-hover"
            )}
            data-testid="button-billing-annual"
          >
            Anual
            <Badge variant="secondary" className="text-xs font-semibold">
              -20%
            </Badge>
          </button>
        </div>

        {/* Cards de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {plans.map((plan) => {
            const config = getPlanConfig(plan.name);
            const Icon = config.icon;
            const monthlyPrice = getMonthlyEquivalent(plan.price);
            const totalPrice = getPlanPrice(plan.price);
            const isPopular = plan.name.toLowerCase() === 'pro';

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md border",
                  isPopular 
                    ? "border-accent shadow-lg scale-[1.02]" 
                    : "border-[var(--border-default)]"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1.5 rounded-bl-lg">
                    MÁS POPULAR
                  </div>
                )}
                
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: config.color + '15' }}
                      >
                        <Icon className="h-5 w-5" style={{ color: config.color }} />
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-default)]">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] min-h-[32px]">
                      {config.description}
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="py-2">
                    {plan.price === null ? (
                      <div>
                        <div className="text-3xl font-bold text-[var(--text-default)]">
                          Contactar
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          Precio personalizado
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-[var(--text-muted)]">USD</span>
                          <span className="text-4xl font-bold text-[var(--text-default)]">
                            {monthlyPrice}
                          </span>
                          <span className="text-sm text-[var(--text-muted)]">/mes</span>
                        </div>
                        {billingPeriod === 'annual' && (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            USD {totalPrice} al año
                          </div>
                        )}
                        {plan.billing_type === 'per_user' && plan.name.toLowerCase() === 'teams' && (
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            Por usuario/asiento
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Límites */}
                  <div className="space-y-2 pb-4 border-b border-[var(--border-default)]">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Límites
                    </div>
                    <div className="space-y-1.5 text-xs text-[var(--text-default)]">
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">📁</span>
                        <span>{config.limits.projects}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">💾</span>
                        <span>{config.limits.storage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">🤖</span>
                        <span>{config.limits.ai}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">👥</span>
                        <span>{config.limits.users}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Incluye
                    </div>
                    <ul className="space-y-2">
                      {config.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                          <span className="text-[var(--text-default)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botón CTA */}
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "secondary"}
                    data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.price === null ? 'Contactar ventas' : 
                     billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabla de Comparación */}
        <div className="mt-16 px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-[var(--text-default)]">
            Comparación Detallada
          </h2>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--table-header-bg)] border-b border-[var(--table-header-border)]">
                    <th className="text-left p-4 font-semibold text-sm text-[var(--table-header-fg)]">
                      Característica
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center p-4 font-semibold text-sm text-[var(--table-header-fg)]">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--table-row-border)]">
                  {/* Proyectos */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      GESTIÓN DE PROYECTOS
                    </td>
                  </tr>
                  <TableRow label="Número de proyectos" values={['3', '50', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Dashboard de proyecto" values={[true, true, true, true]} />
                  <TableRow label="Vistas Gantt y Kanban" values={['Básicas', 'Avanzadas', 'Avanzadas', 'Avanzadas']} />
                  <TableRow label="Gestión de tareas" values={[true, true, true, true]} />
                  <TableRow label="Reportes de progreso" values={['Básicos', 'Avanzados', 'Avanzados + IA', 'Personalizados']} />

                  {/* Financiero */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      GESTIÓN FINANCIERA
                    </td>
                  </tr>
                  <TableRow label="Presupuestos" values={[true, true, true, true]} />
                  <TableRow label="Multi-moneda" values={[false, true, true, true]} />
                  <TableRow label="Control de gastos" values={['Básico', 'Avanzado', 'Avanzado', 'Completo']} />
                  <TableRow label="Análisis de rentabilidad" values={[false, true, true, true]} />
                  <TableRow label="Integración Mercado Pago/PayPal" values={[false, true, true, true]} />

                  {/* Construcción */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      CONSTRUCCIÓN
                    </td>
                  </tr>
                  <TableRow label="Control de subcontratos" values={['Básico', 'Avanzado', 'Avanzado', 'Completo']} />
                  <TableRow label="Gestión de personal" values={['Hasta 10', 'Hasta 100', 'Ilimitado', 'Ilimitado']} />
                  <TableRow label="Diario de obra" values={[true, true, true, true]} />

                  {/* Almacenamiento */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      ALMACENAMIENTO
                    </td>
                  </tr>
                  <TableRow label="Espacio de archivos" values={['500 MB', '50 GB', '500 GB', 'Personalizado']} />
                  <TableRow label="PDFs personalizables" values={[false, true, true, true]} />
                  <TableRow label="Backup automático" values={['Semanal', 'Diario', 'Cada 6hs', 'Continuo']} />

                  {/* IA */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      INTELIGENCIA ARTIFICIAL
                    </td>
                  </tr>
                  <TableRow label="Tokens IA/mes" values={['Resúmenes', '10,000', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Asistente conversacional" values={[false, true, true, true]} />
                  <TableRow label="Análisis financiero IA" values={[false, true, true, true]} />

                  {/* Colaboración */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      COLABORACIÓN
                    </td>
                  </tr>
                  <TableRow label="Usuarios" values={['1', '1', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Roles y permisos" values={[false, false, true, true]} />
                  <TableRow label="Tiempo real" values={[false, false, true, true]} />

                  {/* Soporte */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-xs text-[var(--table-group-header-fg)]">
                      SOPORTE
                    </td>
                  </tr>
                  <TableRow label="Email" values={[true, true, true, true]} />
                  <TableRow label="Prioritario" values={[false, true, true, true]} />
                  <TableRow label="24/7" values={[false, false, true, true]} />
                  <TableRow label="Gerente dedicado" values={[false, false, false, true]} />
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-[var(--text-default)]">
            Preguntas Frecuentes
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Cómo funciona el periodo de prueba?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                14 días de prueba gratuita en todos los planes pagos. Sin necesidad de tarjeta.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Puedo cambiar de plan?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                Sí, puedes actualizar o degradar en cualquier momento. Los cambios se aplican inmediatamente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Qué son los tokens de IA?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                Tokens para análisis financieros y consultas avanzadas. Pro incluye 10k mensuales, Teams tiene ilimitados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Cómo obtengo el badge de Fundador?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                Con cualquier suscripción anual obtienes el badge permanente, acceso anticipado, grupo privado y 10% de descuento futuro.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Qué métodos de pago aceptan?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                Tarjetas (Visa, Mastercard, Amex), Mercado Pago (ARG), PayPal, transferencias. Enterprise con facturación personalizada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                ¿Qué pasa con mis datos si cancelo?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-muted)]">
                Tus datos permanecen 90 días. Puedes reactivar sin pérdida o exportar antes de cancelar.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Final */}
        <Card className="mt-16 mx-4 bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 border-2 border-accent/20">
          <div className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold text-[var(--text-default)]">
              ¿Listo para transformar tu gestión?
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
              Únete a cientos de profesionales optimizando sus proyectos con Archub.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button 
                variant="default"
                data-testid="button-cta-trial"
              >
                Comenzar prueba gratuita
              </Button>
              <Button 
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
  values 
}: { 
  label: string; 
  values: (string | number | boolean)[] 
}) {
  return (
    <tr className="hover:bg-[var(--table-row-hover-bg)] transition-colors">
      <td className="p-3 text-xs font-medium text-[var(--text-default)]">
        {label}
      </td>
      {values.map((value, idx) => (
        <td key={idx} className="p-3 text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="h-4 w-4 text-green-500 mx-auto" />
            ) : (
              <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto" />
            )
          ) : (
            <span className="text-xs text-[var(--text-default)]">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
