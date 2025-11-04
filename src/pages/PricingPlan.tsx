import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, Sparkles, Users, Briefcase, Zap } from "lucide-react";
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
      bgColor: string;
      description: string;
      features: string[];
      limits: { projects: string; storage: string; ai: string; users: string };
    }> = {
      'free': {
        icon: Sparkles,
        color: 'hsl(76, 100%, 40%)',
        bgColor: 'var(--plan-free-bg)',
        description: 'Perfecto para comenzar y explorar la plataforma',
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
          ai: 'Solo resúmenes diarios',
          users: '1 usuario'
        }
      },
      'pro': {
        icon: Zap,
        color: 'hsl(213, 100%, 33%)',
        bgColor: 'var(--plan-pro-bg)',
        description: 'Para profesionales que necesitan herramientas avanzadas',
        features: [
          'Todo en Free, más:',
          'Gestión multi-moneda (ARS, USD)',
          'PDFs personalizables y reportes',
          'Análisis financiero con IA (10k tokens/mes)',
          'Control de subcontratos',
          'Gestión de personal y asistencias',
          'Vistas Gantt y Kanban avanzadas',
          'Integración con Mercado Pago y PayPal',
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
        bgColor: 'var(--plan-teams-bg)',
        description: 'Diseñado para equipos que colaboran en múltiples proyectos',
        features: [
          'Todo en Pro, más:',
          'Usuarios ilimitados con roles y permisos',
          'IA ilimitada para todo el equipo',
          'Colaboración en tiempo real',
          'Historial de cambios y auditoría',
          'Panel de administración de equipo',
          'Gestión de múltiples organizaciones',
          'API de integración',
          'Soporte dedicado 24/7'
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
        bgColor: 'linear-gradient(135deg, hsl(240, 5%, 25%) 0%, hsl(240, 5%, 15%) 100%)',
        description: 'Solución personalizada para grandes organizaciones',
        features: [
          'Todo en Teams, más:',
          'Implementación on-premise disponible',
          'SSO y autenticación personalizada',
          'Cumplimiento de normativas específicas',
          'Capacitación del equipo incluida',
          'Gerente de cuenta dedicado',
          'SLA garantizado del 99.9%',
          'Desarrollo de funcionalidades a medida',
          'Integración con sistemas existentes'
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Banner Fundador */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <div className="p-6 flex items-start gap-4">
            <div className="p-3 bg-amber-500 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  Oferta de Lanzamiento: Conviértete en Fundador
                </h3>
                <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                  Tiempo Limitado
                </Badge>
              </div>
              <p className="text-amber-800 dark:text-amber-200 mb-3">
                Por ser parte de los primeros usuarios de Archub, cualquier suscripción <strong>ANUAL</strong> te otorga beneficios exclusivos de por vida:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 flex-shrink-0" />
                  <span>Badge de "Fundador" visible en tu perfil</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span>Acceso anticipado a nuevas funcionalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>Invitación al grupo privado de Fundadores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 flex-shrink-0" />
                  <span>10% de descuento adicional en futuras renovaciones</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Header de Pricing */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[var(--text-default)]">
            Planes simples y transparentes
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen actualizaciones gratuitas y soporte.
          </p>

          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                billingPeriod === 'monthly'
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-card-fg hover:bg-card-hover"
              )}
              data-testid="button-billing-monthly"
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors relative",
                billingPeriod === 'annual'
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-card-fg hover:bg-card-hover"
              )}
              data-testid="button-billing-annual"
            >
              Anual
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                Ahorra 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Cards de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  "relative overflow-hidden transition-all hover:shadow-lg",
                  isPopular && "ring-2 ring-accent shadow-xl scale-105"
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MÁS POPULAR
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  {/* Icono y nombre */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: config.color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-default)]">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-[var(--text-muted)] min-h-[40px]">
                    {config.description}
                  </p>

                  {/* Precio */}
                  <div className="py-4">
                    {plan.price === null ? (
                      <div>
                        <div className="text-3xl font-bold text-[var(--text-default)]">
                          Contactar
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          Precio personalizado
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-[var(--text-default)]">
                            ${monthlyPrice}
                          </span>
                          <span className="text-[var(--text-muted)]">/mes</span>
                        </div>
                        {billingPeriod === 'annual' && (
                          <div className="text-sm text-[var(--text-muted)] mt-1">
                            ${totalPrice} facturado anualmente
                          </div>
                        )}
                        {plan.billing_type === 'per_user' && plan.name.toLowerCase() === 'teams' && (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            Precio por usuario/asiento
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botón CTA */}
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.price === null ? 'Contactar ventas' : 
                     billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'}
                  </Button>

                  {/* Límites */}
                  <div className="space-y-2 pt-4 border-t border-[var(--border-default)]">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                      Límites
                    </div>
                    <div className="space-y-1 text-sm text-[var(--text-default)]">
                      <div>📁 {config.limits.projects}</div>
                      <div>💾 {config.limits.storage}</div>
                      <div>🤖 {config.limits.ai}</div>
                      <div>👥 {config.limits.users}</div>
                    </div>
                  </div>

                  {/* Features principales */}
                  <div className="space-y-2 pt-4 border-t border-[var(--border-default)]">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                      Incluye
                    </div>
                    <ul className="space-y-2">
                      {config.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                          <span className="text-[var(--text-default)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabla de Comparación */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-[var(--text-default)]">
            Comparación Detallada de Planes
          </h2>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--table-header-bg)] border-b border-[var(--table-header-border)]">
                    <th className="text-left p-4 font-semibold text-[var(--table-header-fg)]">
                      Característica
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center p-4 font-semibold text-[var(--table-header-fg)]">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--table-row-border)]">
                  {/* Proyectos */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      GESTIÓN DE PROYECTOS
                    </td>
                  </tr>
                  <TableRow label="Número de proyectos" values={['3', '50', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Dashboard de proyecto" values={[true, true, true, true]} />
                  <TableRow label="Vistas Gantt y Kanban" values={['Básicas', 'Avanzadas', 'Avanzadas', 'Avanzadas']} />
                  <TableRow label="Gestión de tareas" values={[true, true, true, true]} />
                  <TableRow label="Seguimiento de hitos" values={[true, true, true, true]} />
                  <TableRow label="Reportes de progreso" values={['Básicos', 'Avanzados', 'Avanzados + IA', 'Personalizados']} />
                  <TableRow label="Plantillas de proyecto" values={['5 básicas', '20 avanzadas', 'Ilimitadas', 'Personalizadas']} />

                  {/* Financiero */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      GESTIÓN FINANCIERA
                    </td>
                  </tr>
                  <TableRow label="Presupuestos y cotizaciones" values={[true, true, true, true]} />
                  <TableRow label="Multi-moneda (ARS, USD, EUR)" values={[false, true, true, true]} />
                  <TableRow label="Gestión de cotizaciones" values={[false, true, true, true]} />
                  <TableRow label="Control de gastos" values={['Básico', 'Avanzado', 'Avanzado', 'Completo']} />
                  <TableRow label="Análisis de rentabilidad" values={[false, true, true, true]} />
                  <TableRow label="Flujo de caja" values={[false, true, true, true]} />
                  <TableRow label="Reportes financieros" values={['Básicos', 'Avanzados', 'Avanzados', 'Personalizados']} />
                  <TableRow label="Integración Mercado Pago" values={[false, true, true, true]} />
                  <TableRow label="Integración PayPal" values={[false, true, true, true]} />
                  <TableRow label="Integración contable" values={[false, false, true, true]} />

                  {/* Construcción */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      GESTIÓN DE CONSTRUCCIÓN
                    </td>
                  </tr>
                  <TableRow label="Control de subcontratos" values={['Básico', 'Avanzado', 'Avanzado', 'Completo']} />
                  <TableRow label="Gestión de personal" values={['Hasta 10', 'Hasta 100', 'Ilimitado', 'Ilimitado']} />
                  <TableRow label="Control de asistencias" values={[true, true, true, true]} />
                  <TableRow label="Planillas de avance" values={[true, true, true, true]} />
                  <TableRow label="Diario de obra" values={[true, true, true, true]} />
                  <TableRow label="Gestión de proveedores" values={['Hasta 20', 'Hasta 200', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Control de materiales" values={[true, true, true, true]} />
                  <TableRow label="Certificaciones de obra" values={[false, true, true, true]} />

                  {/* Documentos y Almacenamiento */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      DOCUMENTOS Y ALMACENAMIENTO
                    </td>
                  </tr>
                  <TableRow label="Almacenamiento de archivos" values={['500 MB', '50 GB', '500 GB', 'Personalizado']} />
                  <TableRow label="Gestión documental" values={[true, true, true, true]} />
                  <TableRow label="Versionado de archivos" values={[false, true, true, true]} />
                  <TableRow label="Compartir documentos" values={['Básico', 'Avanzado', 'Avanzado', 'Avanzado']} />
                  <TableRow label="PDFs personalizables" values={[false, true, true, true]} />
                  <TableRow label="Firmas electrónicas" values={[false, false, true, true]} />
                  <TableRow label="Backup automático" values={['Semanal', 'Diario', 'Cada 6hs', 'Continuo']} />

                  {/* Inteligencia Artificial */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      INTELIGENCIA ARTIFICIAL
                    </td>
                  </tr>
                  <TableRow label="Tokens de IA por mes" values={['Solo resúmenes', '10,000', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Asistente IA conversacional" values={[false, true, true, true]} />
                  <TableRow label="Análisis financiero con IA" values={[false, true, true, true]} />
                  <TableRow label="Resúmenes de proyecto" values={[true, true, true, true]} />
                  <TableRow label="Predicción de costos" values={[false, false, true, true]} />
                  <TableRow label="Detección de anomalías" values={[false, false, true, true]} />
                  <TableRow label="Recomendaciones inteligentes" values={[false, true, true, true]} />

                  {/* Colaboración */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      COLABORACIÓN Y EQUIPOS
                    </td>
                  </tr>
                  <TableRow label="Usuarios" values={['1', '1', 'Ilimitados', 'Ilimitados']} />
                  <TableRow label="Roles y permisos" values={[false, false, true, true]} />
                  <TableRow label="Colaboración en tiempo real" values={[false, false, true, true]} />
                  <TableRow label="Comentarios y menciones" values={[false, true, true, true]} />
                  <TableRow label="Historial de cambios" values={[false, false, true, true]} />
                  <TableRow label="Notificaciones personalizables" values={['Básicas', 'Básicas', 'Avanzadas', 'Avanzadas']} />
                  <TableRow label="Chat de equipo" values={[false, false, true, true]} />

                  {/* Integraciones */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      INTEGRACIONES
                    </td>
                  </tr>
                  <TableRow label="API de integración" values={[false, false, true, true]} />
                  <TableRow label="Webhooks" values={[false, false, true, true]} />
                  <TableRow label="Zapier / Make" values={[false, false, true, true]} />
                  <TableRow label="Google Drive" values={[false, true, true, true]} />
                  <TableRow label="Dropbox" values={[false, true, true, true]} />
                  <TableRow label="WhatsApp Business" values={[false, false, true, true]} />
                  <TableRow label="Slack / Discord" values={[false, false, true, true]} />
                  <TableRow label="Integraciones personalizadas" values={[false, false, false, true]} />

                  {/* Soporte */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      SOPORTE Y CAPACITACIÓN
                    </td>
                  </tr>
                  <TableRow label="Soporte por email" values={[true, true, true, true]} />
                  <TableRow label="Base de conocimientos" values={[true, true, true, true]} />
                  <TableRow label="Videos tutoriales" values={[true, true, true, true]} />
                  <TableRow label="Soporte prioritario" values={[false, true, true, true]} />
                  <TableRow label="Soporte 24/7" values={[false, false, true, true]} />
                  <TableRow label="Gerente de cuenta dedicado" values={[false, false, false, true]} />
                  <TableRow label="Capacitación del equipo" values={[false, false, false, true]} />
                  <TableRow label="Onboarding personalizado" values={[false, false, false, true]} />
                  <TableRow label="SLA garantizado" values={[false, false, false, '99.9%']} />

                  {/* Seguridad */}
                  <tr className="bg-[var(--table-group-header-bg)]">
                    <td colSpan={5} className="p-3 font-semibold text-sm text-[var(--table-group-header-fg)]">
                      SEGURIDAD Y CUMPLIMIENTO
                    </td>
                  </tr>
                  <TableRow label="Cifrado de datos" values={[true, true, true, true]} />
                  <TableRow label="Autenticación de dos factores" values={[true, true, true, true]} />
                  <TableRow label="SSO (Single Sign-On)" values={[false, false, false, true]} />
                  <TableRow label="Auditoría de seguridad" values={[false, false, true, true]} />
                  <TableRow label="Cumplimiento GDPR" values={[true, true, true, true]} />
                  <TableRow label="Implementación on-premise" values={[false, false, false, true]} />
                  <TableRow label="IP whitelisting" values={[false, false, false, true]} />
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-[var(--text-default)]">
            Preguntas Frecuentes
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Cómo funciona el periodo de prueba?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Todos los planes pagos incluyen 14 días de prueba gratuita. No necesitas ingresar datos de tarjeta para comenzar. Puedes explorar todas las funcionalidades del plan durante este periodo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Puedo cambiar de plan en cualquier momento?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Al actualizar, tendrás acceso inmediato a las nuevas funcionalidades. Al degradar, los cambios se aplicarán al final de tu periodo de facturación actual.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Qué son los tokens de IA?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Los tokens de IA se consumen cuando utilizas el asistente conversacional para análisis financieros, predicciones, y consultas avanzadas. Un token equivale aproximadamente a 4 caracteres. El plan Pro incluye 10,000 tokens mensuales (suficiente para unas 200-300 consultas complejas), mientras que Teams tiene tokens ilimitados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Cómo funciona el badge de "Fundador"?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Los primeros usuarios que adquieran cualquier suscripción anual recibirán el badge de "Fundador" de forma permanente. Este badge incluye acceso anticipado a nuevas funcionalidades, un grupo privado exclusivo, y un 10% de descuento adicional en todas las renovaciones futuras. Esta oferta es por tiempo limitado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Qué métodos de pago aceptan?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias, Mercado Pago (para Argentina), y PayPal. Para planes Enterprise, también ofrecemos facturación personalizada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Qué pasa con mis datos si cancelo mi suscripción?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                Tu información permanece segura en nuestros servidores durante 90 días después de la cancelación. Durante este periodo, puedes reactivar tu cuenta sin perder datos. También puedes exportar toda tu información en cualquier momento antes de cancelar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿El plan Teams es por usuario o por organización?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                El plan Teams se cobra por asiento/usuario activo. Puedes agregar o remover usuarios en cualquier momento, y solo pagarás por los usuarios activos en ese periodo. Todos los usuarios tienen acceso completo a las funcionalidades del plan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-card border border-[var(--border-default)] rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                ¿Necesito conocimientos técnicos para usar Archub?
              </AccordionTrigger>
              <AccordionContent className="text-[var(--text-muted)]">
                No. Archub está diseñado para ser intuitivo y fácil de usar, incluso para usuarios sin experiencia técnica. Incluimos videos tutoriales, documentación completa, y soporte para ayudarte en cada paso. Los planes superiores también incluyen capacitación personalizada.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Final */}
        <Card className="mt-12 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white">
          <div className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">
              ¿Listo para transformar tu gestión de proyectos?
            </h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Únete a cientos de profesionales que ya están optimizando sus proyectos con Archub.
              Comienza tu prueba gratuita hoy mismo.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button 
                variant="outline" 
                className="bg-white text-accent hover:bg-white/90 border-white"
                data-testid="button-cta-trial"
              >
                Comenzar prueba gratuita
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent text-white hover:bg-white/10 border-white"
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
      <td className="p-4 text-sm font-medium text-[var(--text-default)]">
        {label}
      </td>
      {values.map((value, idx) => (
        <td key={idx} className="p-4 text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="h-5 w-5 text-green-500 mx-auto" />
            ) : (
              <X className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" />
            )
          ) : (
            <span className="text-sm text-[var(--text-default)]">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
