import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, CreditCard, Folder, HardDrive, Users, Briefcase, Bot } from "lucide-react";
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
type SelectedPlan = 'free' | 'pro' | 'teams';

export default function PricingPlan() {
  const { setSidebarLevel } = useNavigationStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [selectedPlanForComparison, setSelectedPlanForComparison] = useState<SelectedPlan>('pro');
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
      bgColor: string;
      cardHeader: string;
      description: string;
      features: string[];
      limits: { iconComponent: any; value: string }[];
    }> = {
      'free': {
        icon: Folder,
        iconColor: '#84cc16',
        bgColor: 'rgba(132, 204, 22, 0.08)',
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
          { iconComponent: Folder, value: '3 proyectos' },
          { iconComponent: HardDrive, value: '500 MB' },
          { iconComponent: Bot, value: 'Solo resúmenes' },
          { iconComponent: Users, value: '1 usuario' }
        ]
      },
      'pro': {
        icon: Bot,
        iconColor: '#0047AB',
        bgColor: 'rgba(0, 71, 171, 0.08)',
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
          { iconComponent: Folder, value: '50 proyectos' },
          { iconComponent: HardDrive, value: '50 GB' },
          { iconComponent: Bot, value: '10,000 tokens/mes' },
          { iconComponent: Users, value: '1 usuario' }
        ]
      },
      'teams': {
        icon: Users,
        iconColor: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.08)',
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
          { iconComponent: Folder, value: 'Ilimitados' },
          { iconComponent: HardDrive, value: '500 GB' },
          { iconComponent: Bot, value: 'Ilimitados' },
          { iconComponent: Users, value: 'Ilimitados' }
        ]
      },
      'enterprise': {
        icon: Briefcase,
        iconColor: '#64748b',
        bgColor: 'rgba(100, 116, 139, 0.08)',
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

  const comparisonData = [
    {
      category: 'Gestión de Proyectos',
      rows: [
        { label: 'Número de proyectos', free: '3', pro: '50', teams: 'Ilimitados' },
        { label: 'Dashboard de proyecto', free: true, pro: true, teams: true },
        { label: 'Vistas Gantt y Kanban', free: 'Básicas', pro: 'Avanzadas', teams: 'Avanzadas' },
        { label: 'Reportes de progreso', free: 'Básicos', pro: 'Avanzados', teams: 'Avanzados + IA' }
      ]
    },
    {
      category: 'Gestión Financiera',
      rows: [
        { label: 'Presupuestos', free: true, pro: true, teams: true },
        { label: 'Multi-moneda (ARS, USD)', free: false, pro: true, teams: true },
        { label: 'Control de gastos', free: 'Básico', pro: 'Avanzado', teams: 'Avanzado' },
        { label: 'Análisis de rentabilidad', free: false, pro: true, teams: true },
        { label: 'Integraciones de pago', free: false, pro: true, teams: true }
      ]
    },
    {
      category: 'Construcción',
      rows: [
        { label: 'Subcontratos', free: 'Básico', pro: 'Avanzado', teams: 'Avanzado' },
        { label: 'Personal', free: 'Hasta 10', pro: 'Hasta 100', teams: 'Ilimitado' },
        { label: 'Bitácora de obra', free: true, pro: true, teams: true }
      ]
    },
    {
      category: 'Almacenamiento',
      rows: [
        { label: 'Espacio de archivos', free: '500 MB', pro: '50 GB', teams: '500 GB' },
        { label: 'PDFs personalizables', free: false, pro: true, teams: true },
        { label: 'Backup automático', free: 'Semanal', pro: 'Diario', teams: 'Cada 6hs' }
      ]
    },
    {
      category: 'Inteligencia Artificial',
      rows: [
        { label: 'Tokens IA/mes', free: 'Resúmenes', pro: '10,000', teams: 'Ilimitados' },
        { label: 'Asistente conversacional', free: false, pro: true, teams: true },
        { label: 'Análisis financiero IA', free: false, pro: true, teams: true }
      ]
    },
    {
      category: 'Colaboración',
      rows: [
        { label: 'Usuarios', free: '1', pro: '1', teams: 'Ilimitados' },
        { label: 'Roles y permisos', free: false, pro: false, teams: true },
        { label: 'Colaboración en tiempo real', free: false, pro: false, teams: true }
      ]
    },
    {
      category: 'Soporte',
      rows: [
        { label: 'Email', free: true, pro: true, teams: true },
        { label: 'Prioritario', free: false, pro: true, teams: true },
        { label: '24/7', free: false, pro: false, teams: true }
      ]
    }
  ];

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
        
        {/* Banner Fundador */}
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

        {/* Cards de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                    ? "bg-[#1a1a1a] dark:bg-[#1a1a1a] scale-105 shadow-2xl" 
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
                    <Icon 
                      className="h-6 w-6" 
                      style={{ color: config.iconColor }}
                    />
                    <h3 
                      className={cn(
                        "text-2xl font-bold",
                        isPopular && "pricing-plan-title-white"
                      )}
                    >
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
                    disabled={plan.name.toLowerCase() === 'pro' || plan.name.toLowerCase() === 'teams'}
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
                      {config.limits.map((limit, idx) => {
                        const LimitIcon = limit.iconComponent;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <LimitIcon 
                              className="h-4 w-4" 
                              style={{ color: config.iconColor }}
                            />
                            <span className={cn(
                              "text-sm",
                              isPopular ? "text-gray-300" : "text-[var(--text-default)]"
                            )}>
                              {limit.value}
                            </span>
                          </div>
                        );
                      })}
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
                          <Check 
                            className="h-4 w-4 mt-0.5 flex-shrink-0" 
                            style={{ color: config.iconColor }}
                          />
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

        {/* Enterprise Plan */}
        {enterprisePlan && (
          <div className="max-w-6xl mx-auto">
            <Card className="border border-[var(--border-default)] overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="text-xs text-[var(--text-muted)]">
                    {getPlanConfig('enterprise').cardHeader}
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6" style={{ color: getPlanConfig('enterprise').iconColor }} />
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

        {/* Tabla de Comparación - IDÉNTICA a referencia */}
        <div className="mt-20 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-default)]">
            Comparación Detallada
          </h2>
          
          {/* Selector Mobile */}
          <div className="md:hidden mb-6 flex justify-center">
            <div className="inline-flex bg-card rounded-lg p-1 border border-[var(--border-default)]">
              {(['free', 'pro', 'teams'] as SelectedPlan[]).map((planKey) => (
                <button
                  key={planKey}
                  onClick={() => setSelectedPlanForComparison(planKey)}
                  className={cn(
                    "px-6 py-2 rounded-md text-sm font-medium transition-all capitalize",
                    selectedPlanForComparison === planKey
                      ? "bg-accent text-accent-foreground"
                      : "text-[var(--text-muted)]"
                  )}
                  data-testid={`tab-comparison-${planKey}`}
                >
                  {planKey}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            {/* Desktop: 4 columnas */}
            <div className="hidden md:block">
              <div className="grid grid-cols-4 gap-4">
                {/* Header con info de planes y botones */}
                <div className="p-6">
                  {/* Espacio vacío en esquina superior izquierda */}
                </div>
                
                {/* Free Column Header */}
                <div 
                  className="p-6 space-y-4 rounded-lg border border-[var(--border-default)]"
                  style={{ backgroundColor: getPlanConfig('free').bgColor }}
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--text-default)] mb-1">Free</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {getPlanConfig('free').description}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full text-xs text-white"
                    style={{ backgroundColor: getPlanConfig('free').iconColor }}
                    data-testid="button-table-free"
                  >
                    Comenzar
                  </Button>
                </div>

                {/* Pro Column Header */}
                <div 
                  className="p-6 space-y-4 rounded-lg border border-[var(--border-default)]"
                  style={{ backgroundColor: getPlanConfig('pro').bgColor }}
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--text-default)] mb-1">Pro</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {getPlanConfig('pro').description}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full text-xs text-white"
                    style={{ backgroundColor: getPlanConfig('pro').iconColor }}
                    disabled
                    data-testid="button-table-pro"
                  >
                    Ser Fundador
                  </Button>
                </div>

                {/* Teams Column Header */}
                <div 
                  className="p-6 space-y-4 rounded-lg border border-[var(--border-default)]"
                  style={{ backgroundColor: getPlanConfig('teams').bgColor }}
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--text-default)] mb-1">Teams</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {getPlanConfig('teams').description}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full text-xs text-white"
                    style={{ backgroundColor: getPlanConfig('teams').iconColor }}
                    disabled
                    data-testid="button-table-teams"
                  >
                    Comenzar
                  </Button>
                </div>

                {/* Rows */}
                {comparisonData.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="col-span-4 contents">
                    {/* Category Header - Color continuo en columnas */}
                    <div className="p-3 pt-6">
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        {section.category}
                      </h3>
                    </div>
                    <div 
                      className="p-3 pt-6"
                      style={{ backgroundColor: getPlanConfig('free').bgColor }}
                    />
                    <div 
                      className="p-3 pt-6"
                      style={{ backgroundColor: getPlanConfig('pro').bgColor }}
                    />
                    <div 
                      className="p-3 pt-6"
                      style={{ backgroundColor: getPlanConfig('teams').bgColor }}
                    />
                    
                    {/* Category Rows */}
                    {section.rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="contents">
                        <div className="p-4 text-sm font-medium text-[var(--text-default)]">
                          {row.label}
                        </div>
                        <div 
                          className="p-4 flex justify-center items-center"
                          style={{ backgroundColor: getPlanConfig('free').bgColor }}
                        >
                          {renderValue(row.free, getPlanConfig('free').iconColor)}
                        </div>
                        <div 
                          className="p-4 flex justify-center items-center"
                          style={{ backgroundColor: getPlanConfig('pro').bgColor }}
                        >
                          {renderValue(row.pro, getPlanConfig('pro').iconColor)}
                        </div>
                        <div 
                          className="p-4 flex justify-center items-center"
                          style={{ backgroundColor: getPlanConfig('teams').bgColor }}
                        >
                          {renderValue(row.teams, getPlanConfig('teams').iconColor)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: 2 columnas */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-0 border border-[var(--border-default)] rounded-lg overflow-hidden">
                {/* Header con botón */}
                <div className="col-span-2 p-4" style={{ backgroundColor: getPlanConfig(selectedPlanForComparison).bgColor }}>
                  <div className="mb-3">
                    <div className="text-sm font-bold text-[var(--text-default)] mb-1 capitalize">
                      {selectedPlanForComparison}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {getPlanConfig(selectedPlanForComparison).description}
                    </div>
                  </div>
                  <Button 
                    variant={selectedPlanForComparison === 'pro' ? 'default' : 'secondary'}
                    size="sm" 
                    className="w-full text-xs"
                    disabled={selectedPlanForComparison === 'pro' || selectedPlanForComparison === 'teams'}
                  >
                    {selectedPlanForComparison === 'pro' ? 'Ser Fundador' : 'Comenzar'}
                  </Button>
                </div>

                {/* Rows */}
                {comparisonData.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="col-span-2 contents">
                    {/* Category Header */}
                    <div className="col-span-2 bg-[var(--accent)]/5 p-2.5 border-t border-[var(--border-default)]">
                      <h3 className="text-[10px] font-bold text-[var(--text-default)] uppercase tracking-wider">
                        {section.category}
                      </h3>
                    </div>
                    
                    {/* Category Rows */}
                    {section.rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="contents">
                        <div className="bg-background p-3 text-xs font-medium text-[var(--text-default)] border-t border-r border-[var(--border-default)]">
                          {row.label}
                        </div>
                        <div 
                          className="p-3 flex justify-center items-center border-t border-[var(--border-default)]"
                          style={{ backgroundColor: getPlanConfig(selectedPlanForComparison).bgColor }}
                        >
                          {renderValue(row[selectedPlanForComparison], getPlanConfig(selectedPlanForComparison).iconColor)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
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
              Únete a cientos de profesionales optimizando sus proyectos con Seencel.
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

function renderValue(value: string | boolean, iconColor: string) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5" style={{ color: iconColor }} />
    ) : (
      <X className="h-4 w-4 text-gray-300 dark:text-gray-700" />
    );
  }
  return <span className="text-sm text-[var(--text-default)]">{value}</span>;
}
