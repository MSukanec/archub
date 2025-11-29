import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";
import { BillingToggle } from "./components/BillingToggle";
import { FounderBanner } from "./components/FounderBanner";
import { PlanCard } from "./components/PlanCard";
import { EnterpriseCard } from "./components/EnterpriseCard";
import { ComparisonTable } from "./components/ComparisonTable";
import { FAQSection } from "./components/FAQSection";
import { buildComparisonData } from "./data/comparison";
import type { PricingContentProps, Plan, BillingPeriod } from "./types";

export function PricingContent({ mode }: PricingContentProps) {
  const [, navigate] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [enterprisePlan, setEnterprisePlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: userData } = useCurrentUser();
  const userPlanName = userData?.organization?.plan?.name;
  const isAuthenticated = !!userData?.user?.id;

  const organizationId = userData?.organization?.id;
  const { data: billableMembersData } = useQuery<{ seats: number }>({
    queryKey: ['/api/billing/next-invoice', organizationId],
    enabled: mode === 'dashboard' && isAuthenticated && !!organizationId
  });

  const getPlanLevel = (planName: string): number => {
    const levels: Record<string, number> = {
      'free': 1,
      'pro': 2,
      'teams': 3,
      'enterprise': 4
    };
    return levels[planName.toLowerCase()] || 0;
  };

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
          features: plan.features || {},
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

  const getPlanFeatures = (planSlug: string) => {
    const plan = plans.find(p => p.slug?.toLowerCase() === planSlug || p.name.toLowerCase() === planSlug);
    return plan?.features || {};
  };

  const handlePlanSelect = (plan: Plan) => {
    const isTeams = plan.name.toLowerCase() === 'teams';
    const isCurrentPlan = plan.name.toLowerCase() === userPlanName?.toLowerCase();
    
    if (isTeams || isCurrentPlan) return;
    
    // Si no está autenticado, ir al registro
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    // Si está autenticado en dashboard, ir al checkout
    if (mode === 'dashboard') {
      navigate(`/subscription/checkout?plan=${plan.slug}&billing=${billingPeriod}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  const freeFeatures = getPlanFeatures('free');
  const proFeatures = getPlanFeatures('pro');
  const teamsFeatures = getPlanFeatures('teams');
  const comparisonData = buildComparisonData(freeFeatures, proFeatures, teamsFeatures);

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
      <BillingToggle 
        billingPeriod={billingPeriod} 
        onBillingPeriodChange={setBillingPeriod} 
      />

      {billingPeriod === 'annual' && <FounderBanner mode={mode} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name.toLowerCase() === userPlanName?.toLowerCase();
          
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              mode={mode}
              isCurrentPlan={isCurrentPlan}
              isAuthenticated={isAuthenticated}
              billableSeats={billableMembersData?.seats || 0}
              onSelect={handlePlanSelect}
            />
          );
        })}
      </div>

      {enterprisePlan && <EnterpriseCard />}

      <ComparisonTable 
        comparisonData={comparisonData}
        userPlanName={userPlanName}
        isAuthenticated={isAuthenticated}
        plans={plans}
        billingPeriod={billingPeriod}
        onPlanSelect={handlePlanSelect}
      />

      <FAQSection />
    </div>
  );
}
