import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayout as Layout, HeroLayout } from "@/layouts";
import { useNavigationStore } from "@/stores/navigationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, CreditCard, Folder, HardDrive, Users, Briefcase, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DowngradeModal } from "@/features/users";
import { useQuery } from "@tanstack/react-query";

interface Plan {
  id: string;
  name: string;
  slug: string;
  monthly_amount: number;
  annual_amount: number;
  features: any;
  billing_type: string;
}

type BillingPeriod = 'monthly' | 'annual';
type SelectedPlan = 'free' | 'pro' | 'teams';

export default function PricingPlan() {
  const [, setLocation] = useLocation();
  const { setSidebarLevel } = useNavigationStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [selectedPlanForComparison, setSelectedPlanForComparison] = useState<SelectedPlan>('pro');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [enterprisePlan, setEnterprisePlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<Plan | null>(null);
  
  const { data: userData } = useCurrentUser();
  const userPlanName = userData?.organization?.plan?.name;
  const isAuthenticated = !!userData?.user?.id;

  // Fetch current subscription info
  const { data: currentSubscription } = useQuery({
    queryKey: ['/api/subscriptions/current'],
    enabled: isAuthenticated
  });

  // Fetch billable members count for Teams plan estimation
  const organizationId = userData?.organization?.id;
  const { data: billableMembersData } = useQuery<{ seats: number }>({
    queryKey: ['/api/billing/next-invoice', organizationId],
    enabled: isAuthenticated && !!organizationId
  });
  
  // Plan hierarchy: FREE < PRO < TEAMS < ENTERPRISE
  const getPlanLevel = (planName: string): number => {
    const levels: Record<string, number> = {
      'free': 1,
      'pro': 2,
      'teams': 3,
      'enterprise': 4
    };
    return levels[planName.toLowerCase()] || 0;
  };
  
  console.log('🔍 PricingPlan Debug FULL userData:', {
    userData: userData,
    organization: userData?.organization,
    plan: userData?.organization?.plan,
    planFromTopLevel: userData?.plan,
    userPlanName,
    isAuthenticated
  });

  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, name, slug, features, billing_type, is_active, monthly_amount, annual_amount')
          .eq('is_active', true);

        if (error) throw error;
        
        const transformedData = (data || []).map(plan => ({
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          features: plan.features,
          billing_type: plan.billing_type,
          monthly_amount: parseFloat(plan.monthly_amount) || 0,
          annual_amount: parseFloat(plan.annual_amount) || 0
        }));
        
        const sortedData = transformedData.sort((a, b) => {
          if (a.monthly_amount === null && b.monthly_amount === null) return 0;
          if (a.monthly_amount === null) return -1;
          if (b.monthly_amount === null) return 1;
          return a.monthly_amount - b.monthly_amount;
        });
        
        const mainPlans = sortedData.filter(p => 
          ['free', 'pro', 'teams'].includes(p.name.toLowerCase())
        );
        const enterprise = sortedData.find(p => p.name.toLowerCase() === 'enterprise');
        
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

  const getPlanPrice = (monthlyAmount: number, annualAmount: number) => {
    if (billingPeriod === 'annual') {
      return annualAmount.toFixed(2);
    }
    return monthlyAmount.toFixed(2);
  };

  const getMonthlyEquivalent = (monthlyAmount: number, annualAmount: number) => {
    if (billingPeriod === 'annual') {
      return (annualAmount / 12).toFixed(2);
    }
    return monthlyAmount.toFixed(2);
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

  // Helper: Extract features from plan by slug
  const getPlanFeatures = (planSlug: string) => {
    const plan = plans.find(p => p.slug?.toLowerCase() === planSlug || p.name.toLowerCase() === planSlug);
    return plan?.features || {};
  };

  // Helper: Format numeric limit (null/high = "Ilimitados", otherwise number)
  const formatLimit = (value: number | null | undefined, suffix?: string): string => {
    if (value === null || value === undefined || value >= 9999) return 'Ilimitados';
    if (value === 1) return '1';
    return suffix ? `${value} ${suffix}` : String(value);
  };

  // Helper: Format member limit for display
  const formatMembers = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value >= 9999) return 'Ilimitados';
    return String(value);
  };

  // Helper: Format storage in MB/GB
  const formatStorage = (mb: number | null | undefined): string => {
    if (mb === null || mb === undefined) return '—';
    if (mb >= 1024) {
      const gb = (mb / 1024).toFixed(0);
      return `${gb} GB`;
    }
    return `${mb} MB`;
  };

  // Helper: Format file size in MB
  const formatFileSize = (mb: number | null | undefined): string => {
    if (mb === null || mb === undefined) return '—';
    if (mb >= 1024) {
      const gb = (mb / 1024).toFixed(1);
      return `${gb} GB`;
    }
    return `${mb} MB`;
  };

  // Build comparison data dynamically from plan features
  const buildComparisonData = () => {
    const freeFeatures = getPlanFeatures('free');
    const proFeatures = getPlanFeatures('pro');
    const teamsFeatures = getPlanFeatures('teams');

    return [
      {
        category: 'Gestión de Proyectos',
        rows: [
          { 
            label: 'Número de proyectos', 
            free: formatLimit(freeFeatures.max_projects),
            pro: formatLimit(proFeatures.max_projects),
            teams: formatLimit(teamsFeatures.max_projects)
          },
          { label: 'Dashboard de proyecto', free: true, pro: true, teams: true },
          { label: 'Colores personalizados por proyecto', free: true, pro: true, teams: true }
        ]
      },
      {
        category: 'Gestión Financiera',
        rows: [
          { label: 'Presupuestos', free: true, pro: true, teams: true },
          { label: 'Multi-moneda (ARS, USD)', free: true, pro: true, teams: true }
        ]
      },
      {
        category: 'Construcción',
        rows: [
          { label: 'Subcontratos', free: true, pro: true, teams: true },
          { label: 'Personal', free: true, pro: true, teams: true },
          { label: 'Bitácora de obra', free: true, pro: true, teams: true }
        ]
      },
      {
        category: 'Almacenamiento',
        rows: [
          { 
            label: 'Espacio de archivos', 
            free: formatStorage(freeFeatures.max_storage_mb),
            pro: formatStorage(proFeatures.max_storage_mb),
            teams: formatStorage(teamsFeatures.max_storage_mb)
          },
          { 
            label: 'Tamaño máximo de archivo', 
            free: formatFileSize(freeFeatures.max_file_size_mb),
            pro: formatFileSize(proFeatures.max_file_size_mb),
            teams: formatFileSize(teamsFeatures.max_file_size_mb)
          },
          { 
            label: 'PDFs personalizables', 
            free: freeFeatures.export_pdf_custom ?? false,
            pro: proFeatures.export_pdf_custom ?? true,
            teams: teamsFeatures.export_pdf_custom ?? true
          },
          { label: 'Backup (incluido en plan)', free: false, pro: true, teams: true }
        ]
      },
      {
        category: 'Inteligencia Artificial',
        rows: [
          { label: 'Tokens IA/mes', free: 'Resúmenes', pro: '10,000', teams: '100,000' },
          { label: 'Asistente conversacional', free: false, pro: true, teams: true },
          { label: 'Análisis financiero IA', free: false, pro: true, teams: true }
        ]
      },
      {
        category: 'Colaboración',
        rows: [
          { 
            label: 'Usuarios', 
            free: formatMembers(freeFeatures.max_members),
            pro: formatMembers(proFeatures.max_members),
            teams: formatMembers(teamsFeatures.max_members)
          },
          { label: 'Roles y permisos', free: false, pro: false, teams: true },
          { label: 'Colaboración en tiempo real', free: false, pro: false, teams: true }
        ]
      },
      {
        category: 'Soporte',
        rows: [
          { label: 'Email', free: true, pro: true, teams: true },
          { label: 'Prioritario', free: false, pro: true, teams: true }
        ]
      }
    ];
  };

  const comparisonData = buildComparisonData();

  if (isLoading) {
    return (
      <Layout hideHeader>
        <HeroLayout>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        </HeroLayout>
      </Layout>
    );
  }

  return (
    <Layout hideHeader>
      <HeroLayout>
        <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
        
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

        {/* Banner Fundador - solo si facturación es anual */}
        {billingPeriod === 'annual' && (
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
        )}

        {/* Cards de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const config = getPlanConfig(plan.name);
            const Icon = config.icon;
            const monthlyPrice = getMonthlyEquivalent(plan.monthly_amount, plan.annual_amount);
            const totalPrice = getPlanPrice(plan.monthly_amount, plan.annual_amount);
            const isPopular = plan.name.toLowerCase() === 'pro';
            const isCurrentPlan = plan.name.toLowerCase() === userPlanName?.toLowerCase();
            const isFree = plan.name.toLowerCase() === 'free';
            const isTeams = plan.name.toLowerCase() === 'teams';
            
            // Determinar si es upgrade o downgrade
            const currentPlanLevel = userPlanName ? getPlanLevel(userPlanName) : 0;
            const thisPlanLevel = getPlanLevel(plan.name);
            const isUpgrade = thisPlanLevel > currentPlanLevel;
            const isDowngrade = thisPlanLevel < currentPlanLevel;
            
            console.log(`🎯 Plan ${plan.name}:`, {
              planNameLower: plan.name.toLowerCase(),
              userPlanNameLower: userPlanName?.toLowerCase(),
              isCurrentPlan,
              isUpgrade,
              isDowngrade,
              isAuthenticated
            });

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
                
                {isCurrentPlan && isAuthenticated && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-green-500 text-white text-[9px] font-bold px-3 py-1 uppercase">
                      Plan Actual
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
                    {isFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-5xl font-bold tracking-tight",
                          isPopular ? "text-white" : "text-[var(--text-default)]"
                        )}>
                          Gratis
                        </span>
                      </div>
                    ) : (
                      <>
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
                            {monthlyPrice}
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
                          <>
                            <div className={cn(
                              "text-xs mt-0.5",
                              isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                            )}>
                              Por usuario/asiento
                            </div>
                            {billableMembersData && billableMembersData.seats > 0 && (
                              <div className={cn(
                                "text-xs mt-1 font-medium",
                                isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                              )}>
                                Costo estimado: USD {(billableMembersData.seats * Number(monthlyPrice)).toFixed(2)}/mes
                                <span className="text-[10px] ml-1">
                                  ({billableMembersData.seats} miembro{billableMembersData.seats > 1 ? 's' : ''} × ${monthlyPrice})
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Botón CTA */}
                  <Button
                    className={cn(
                      "w-full h-11 font-medium rounded-lg",
                      isPopular && !isCurrentPlan
                        ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                        : ""
                    )}
                    variant={
                      isCurrentPlan 
                        ? "outline" 
                        : isPopular 
                          ? "default" 
                          : "secondary"
                    }
                    onClick={() => {
                      if (isCurrentPlan || isTeams) return;
                      
                      if (isDowngrade) {
                        // Open downgrade modal
                        setSelectedDowngradePlan(plan);
                        setDowngradeModalOpen(true);
                      } else {
                        // Go to checkout for upgrades
                        setLocation(`/subscription/checkout?plan=${plan.slug}&billing=${billingPeriod}`)
                      }
                    }}
                    disabled={isCurrentPlan || isTeams}
                    data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
                  >
                    {isTeams ? (
                      'Próximamente'
                    ) : isCurrentPlan ? (
                      'Tu Plan Actual'
                    ) : isAuthenticated ? (
                      isDowngrade ? (
                        `Cambiar a ${plan.name}`
                      ) : isFree ? (
                        'Cambiar a Free'
                      ) : billingPeriod === 'annual' ? (
                        'Suscribirse Anualmente'
                      ) : (
                        'Suscribirse Mensualmente'
                      )
                    ) : (
                      billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'
                    )}
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

        {/* Tabla de Comparación - Estilo Vercel */}
        <div className="mt-20 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-default)]">
            Comparación Detallada
          </h2>
          
          <div className="max-w-6xl mx-auto">
            {/* Desktop: 4 columnas con sticky header */}
            <div className="hidden md:block border border-[var(--border-default)] rounded-lg">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-background border-b border-[var(--border-default)]">
                <div className="grid grid-cols-4">
                  {/* Empty cell for alignment */}
                  <div className="px-6 py-4">
                  </div>
                  
                  {/* Free */}
                  <div className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-[var(--text-default)] mb-2">Free</div>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs"
                      data-testid="button-table-free"
                    >
                      Comenzar
                    </Button>
                  </div>

                  {/* Pro */}
                  <div className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-[var(--text-default)] mb-2">Pro</div>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs"
                      data-testid="button-table-pro"
                    >
                      Ser Fundador
                    </Button>
                  </div>

                  {/* Teams */}
                  <div className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-[var(--text-default)] mb-2">Teams</div>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs"
                      disabled
                      data-testid="button-table-teams"
                    >
                      Próximamente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div>
                {comparisonData.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    {/* Category Header - con bordes arriba y abajo */}
                    <div className="grid grid-cols-4 border-y border-[var(--border-default)]">
                      <div className="col-span-4 px-6 py-3">
                        <h3 className="text-sm font-semibold text-[var(--text-default)]">
                          {section.category}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Category Rows - sin bordes entre items */}
                    {section.rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-4">
                        <div className="px-6 py-3 text-sm text-[var(--text-default)]">
                          {row.label}
                        </div>
                        <div className="px-6 py-3 flex justify-center items-center">
                          {renderValue(row.free, 'currentColor')}
                        </div>
                        <div className="px-6 py-3 flex justify-center items-center">
                          {renderValue(row.pro, 'currentColor')}
                        </div>
                        <div className="px-6 py-3 flex justify-center items-center">
                          {renderValue(row.teams, 'currentColor')}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Sticky tabs + 2 columnas */}
            <div className="md:hidden">
              {/* Sticky Plan Selector */}
              <div className="sticky top-0 z-10 bg-background py-3 border-b border-[var(--border-default)]">
                <div className="flex justify-center gap-2">
                  {(['free', 'pro', 'teams'] as SelectedPlan[]).map((planKey) => (
                    <button
                      key={planKey}
                      onClick={() => setSelectedPlanForComparison(planKey)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
                        selectedPlanForComparison === planKey
                          ? "bg-[var(--text-default)] text-background"
                          : "text-[var(--text-muted)] border border-[var(--border-default)]"
                      )}
                      data-testid={`tab-comparison-${planKey}`}
                    >
                      {planKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="mt-4">
                {comparisonData.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    {/* Category Header - con bordes arriba y abajo */}
                    <div className="px-4 py-3 border-y border-[var(--border-default)]">
                      <h3 className="text-sm font-semibold text-[var(--text-default)]">
                        {section.category}
                      </h3>
                    </div>
                    
                    {/* Category Rows */}
                    {section.rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-2">
                        <div className="px-4 py-3 text-sm text-[var(--text-default)]">
                          {row.label}
                        </div>
                        <div className="px-4 py-3 flex justify-center items-center">
                          {renderValue(row[selectedPlanForComparison], 'currentColor')}
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
                q: "¿Qué es la insignia de Fundador y qué incluye?",
                a: () => (
                  <div>
                    La insignia de Fundador es un reconocimiento exclusivo y permanente que obtienes al suscribirse a cualquier plan anual durante este período de lanzamiento limitado. Es visible en tu perfil como muestra de tu apoyo inicial a Seencel. Los beneficios incluyen: acceso anticipado a nuevas funcionalidades antes que otros usuarios, membresía en el grupo privado de fundadores para networking e intercambio de conocimiento, y descuentos permanentes (10% en renovaciones de suscripción y 20% en cursos) que se mantienen de por vida, incluso si cambias de plan. Si eres fundador en Pro y luego asciendes a Teams, la insignia y todos los beneficios se transfieren y se extienden a todos los miembros actuales y futuros de tu organización.
                  </div>
                )
              },
              {
                q: "¿Puedo cambiar de plan en cualquier momento?",
                a: () => (
                  <div>
                    Sí, puedes actualizar, degradar o cambiar entre planes en cualquier momento sin penalidades. Cuando cambias de plan en medio de un ciclo de facturación, aplicamos prorrateo automático: si actualizas a un plan superior, tu próxima facturación reflejará el costo proporcional del tiempo restante al nuevo precio. Si degradas a un plan inferior, se acumula un crédito que se aplica a tu próxima facturación. No pierdes datos ni acceso: el cambio se aplica inmediatamente.
                  </div>
                )
              },
              {
                q: "¿Cómo funcionan los créditos de IA?",
                a: () => (
                  <div>
                    Los créditos de IA (también llamados 'tokens') son unidades de consumo que utilizas cada vez que interactúas con las funciones de inteligencia artificial de Seencel. Se consumen tanto en consultas pasivas (como pedir análisis de un presupuesto o resumen de documentos) como en acciones automáticas (como sugerencias de optimización o análisis financiero automático). El plan Free incluye créditos limitados ideales para explorar funciones de IA. Pro y Teams incluyen límites mensuales más generosos que se renuevan cada período de facturación. Los créditos no utilizados en un mes no se acumulan para el siguiente.
                  </div>
                )
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: () => (
                  <div>
                    Aceptamos múltiples métodos de pago para tu conveniencia: tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal para pagos internacionales, Mercado Pago para Argentina, y transferencias bancarias. Si eres Enterprise, ofrecemos facturación personalizada con términos negociables. <Link href="/contact" className="text-accent hover:underline">Contacta con nuestro equipo</Link> para más detalles sobre opciones de facturación personalizada.
                  </div>
                )
              },
              {
                q: "¿Qué sucede con mis datos si cancelo la suscripción?",
                a: () => (
                  <div>
                    Tus datos se conservan en nuestros servidores durante 90 días después de la cancelación, lo que te permite reactivar tu cuenta sin perder información. Pasados 90 días, los datos se eliminan permanentemente. Puedes exportar tus datos en cualquier momento antes de la cancelación.
                  </div>
                )
              },
              {
                q: "¿Puedo cambiar entre facturación mensual y anual?",
                a: () => (
                  <div>
                    Sí. Puedes cambiar tu ciclo de facturación en cualquier momento desde la configuración de tu plan. Si pasas de mensual a anual, se aplica un ajuste de precio en tu próxima facturación. Si pasas de anual a mensual, el cambio toma efecto al final de tu ciclo anual actual.
                  </div>
                )
              },
              {
                q: "¿Qué sucede con mi equipo si cambio de plan?",
                a: () => (
                  <div>
                    Para el plan Free (1 usuario), solo tú tienes acceso. En Pro (1 usuario) también es individual pero con más capacidades. En Teams (usuarios ilimitados), puedes agregar miembros y asignarles roles con permisos específicos. Si degradas desde Teams a Pro o Free, los miembros adicionales pierden acceso automáticamente, pero sus datos se preservan por si reinvitas a más usuarios después.
                  </div>
                )
              },
              {
                q: "¿Qué es el plan Enterprise y para quién es?",
                a: () => (
                  <div>
                    El plan Enterprise está diseñado para organizaciones grandes y equipos extensos que requieren soluciones personalizadas y a medida. Este plan te permite personalizar funciones, límites, integraciones y opciones de seguridad según tus necesidades específicas de negocio. Incluye: usuarios ilimitados con gestión avanzada de permisos, almacenamiento y límites de recursos adaptados a tu escala, facturación flexible con términos negociables, soporte prioritario dedicado con SLA garantizado, implementación asistida, y opciones de infraestructura personalizada. Si tu equipo necesita configuraciones específicas, cumplimiento normativo especial, o integraciones personalizadas, Enterprise es la solución ideal. <Link href="/contact" className="text-accent hover:underline">Habla con nuestro equipo de ventas</Link> para discutir tus requerimientos específicos y recibir una propuesta personalizada.
                  </div>
                )
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
                  {faq.a()}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 border border-[var(--border-default)] rounded-xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-[var(--text-default)] mb-2">
                ¿No estás seguro de qué plan elegir?
              </h3>
              <p className="text-[var(--text-muted)]">
                Habla con nuestro equipo sobre Pro, Teams o Enterprise. Conoce opciones de personalización, obtén una demostración personalizada o consulta sobre precios especiales.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/contact">
                <Button 
                  size="lg"
                  variant="default"
                  data-testid="button-cta-contact-pricing"
                  className="whitespace-nowrap"
                >
                  Agendar consulta →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Downgrade Modal */}
      {downgradeModalOpen && selectedDowngradePlan && (
        <DowngradeModal
          modalData={{
            currentPlan: {
              name: userPlanName || '',
              slug: userData?.organization?.plan?.slug || ''
            },
            targetPlan: selectedDowngradePlan,
            subscriptionEndDate: (currentSubscription as any)?.expires_at,
            isManualPlan: !currentSubscription
          }}
          onClose={() => {
            setDowngradeModalOpen(false);
            setSelectedDowngradePlan(null);
          }}
        />
      )}
      </HeroLayout>
    </Layout>
  );
}

function renderValue(value: string | boolean, iconColor: string) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-[var(--text-muted)]" />
    ) : (
      <span className="text-[var(--text-muted)]">—</span>
    );
  }
  return <span className="text-sm text-[var(--text-default)]">{value}</span>;
}
