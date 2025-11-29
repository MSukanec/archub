import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MarketingLayout } from "@/layouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Check, X, Crown, CreditCard, Folder, HardDrive, Users, Briefcase, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";
import { useCurrentUser } from "@/hooks/use-current-user";

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

export default function PricingPlanPublic() {
  const [, navigate] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [enterprisePlan, setEnterprisePlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: userData } = useCurrentUser();
  const isAuthenticated = !!userData?.user?.id;

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
      cardHeader: string;
      description: string;
    }> = {
      'free': {
        icon: Folder,
        iconColor: '#84cc16',
        cardHeader: 'Perfecto para comenzar',
        description: 'Para profesionales individuales'
      },
      'pro': {
        icon: Bot,
        iconColor: '#0047AB',
        cardHeader: 'Para profesionales avanzados',
        description: 'Para equipos que necesitan funciones avanzadas'
      },
      'teams': {
        icon: Users,
        iconColor: '#9333ea',
        cardHeader: 'Para equipos grandes',
        description: 'Para empresas con múltiples equipos'
      },
      'enterprise': {
        icon: Briefcase,
        iconColor: '#64748b',
        cardHeader: 'Soluciones personalizadas',
        description: 'Para empresas grandes con necesidades especiales'
      }
    };

    return configs[planName.toLowerCase()] || configs['free'];
  };

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Inicio", href: "/" },
        { label: "Cursos", href: "/cursos" },
        { label: "Fundadores", href: "/founders" },
        { label: "Contacto", href: "/contact" }
      ]}
      seo={{
        title: "Planes y Precios | Seencel",
        description: "Descubre nuestros planes de precios flexibles para la gestión de construcción. Desde Free hasta Enterprise, encuentra el plan perfecto para tu equipo.",
        ogTitle: "Planes y Precios - Seencel",
        ogDescription: "Soluciones de gestión de construcción con planes para cualquier tamaño de equipo. Comienza gratis o upgrade a Pro."
      }}
    >
      <div className="min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 space-y-16">
        
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Planes Simples y Transparentes
            </h1>
            <p className="text-lg text-white/60">
              Elige el plan que mejor se adapte a tus necesidades. Siempre puedes cambiar cuando quieras.
            </p>
          </div>

          {/* Billing Toggle */}
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
                data-testid="button-billing-monthly-public"
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
                data-testid="button-billing-annual-public"
              >
                <span>Anual</span>
                <span className="text-xs font-bold bg-accent-foreground/20 px-2 py-0.5 rounded">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const config = getPlanConfig(plan.name);
              const Icon = config.icon;
              const monthlyPrice = getMonthlyEquivalent(plan.monthly_amount, plan.annual_amount);
              const isPopular = plan.name.toLowerCase() === 'pro';
              const isFree = plan.name.toLowerCase() === 'free';
              
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
                    {/* Header */}
                    <div className={cn(
                      "text-xs leading-relaxed min-h-[36px]",
                      isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                    )}>
                      {config.cardHeader}
                    </div>

                    {/* Plan Name */}
                    <div className="flex items-center gap-3">
                      <Icon 
                        className="h-6 w-6" 
                        style={{ color: config.iconColor }}
                      />
                      <h3 className={cn(
                        "text-2xl font-bold",
                        isPopular && "text-white"
                      )}>
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
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
                              USD {getPlanPrice(plan.monthly_amount, plan.annual_amount)} al año
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={cn(
                        "w-full h-11 font-medium rounded-lg",
                        isPopular && !isFree
                          ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                          : ""
                      )}
                      variant={isFree ? "secondary" : isPopular ? "default" : "secondary"}
                      onClick={() => {
                        if (isAuthenticated) {
                          navigate('/settings/pricing-plan');
                        } else {
                          navigate('/register');
                        }
                      }}
                      data-testid={`button-plan-cta-${plan.name.toLowerCase()}`}
                    >
                      {isAuthenticated ? 'Ver detalles' : 'Comenzar ahora'}
                    </Button>

                    {/* Description */}
                    <p className={cn(
                      "text-sm",
                      isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                    )}>
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise Card */}
          {enterprisePlan && (
            <Card className="bg-card border border-[var(--border-default)] p-8 max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <Briefcase className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <p className="text-[var(--text-muted)] mb-4">
                    Para empresas grandes con necesidades especiales. Incluye soluciones personalizadas, implementación on-premise, SSO y soporte dedicado.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/contact')}
                    data-testid="button-enterprise-contact"
                  >
                    Contactar Ventas
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Features Comparison */}
          <div className="mt-20 space-y-8">
            <h2 className="text-3xl font-bold text-center text-white">Comparar Planes</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="text-left py-4 px-4 font-semibold text-[var(--text-default)]">Funcionalidad</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center py-4 px-4 font-semibold text-[var(--text-default)]">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-default)]">
                    <td className="py-4 px-4 text-[var(--text-muted)]">Gestión de Proyectos</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border-default)]">
                    <td className="py-4 px-4 text-[var(--text-muted)]">Presupuestos</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border-default)]">
                    <td className="py-4 px-4 text-[var(--text-muted)]">Asistente IA</td>
                    {plans.map(plan => {
                      const hasAI = !['free'].includes(plan.name.toLowerCase());
                      return (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {hasAI ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-[var(--border-default)]">
                    <td className="py-4 px-4 text-[var(--text-muted)]">Colaboración en Tiempo Real</td>
                    {plans.map(plan => {
                      const hasCollaboration = ['teams'].includes(plan.name.toLowerCase());
                      return (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {hasCollaboration ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
