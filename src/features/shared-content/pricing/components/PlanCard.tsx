import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlanConfig } from "../data/plans-config";
import { BlockedRestricted, ComingSoonCard } from "@/components/shared/restrictions";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMultipleFeatureFlags } from "@/hooks/use-feature-flags";
import type { Plan, BillingPeriod, PricingMode } from "../types";

interface PlanCardProps {
  plan: Plan;
  billingPeriod: BillingPeriod;
  mode: PricingMode;
  isCurrentPlan?: boolean;
  isAuthenticated?: boolean;
  billableSeats?: number;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({
  plan,
  billingPeriod,
  mode,
  isCurrentPlan = false,
  isAuthenticated = false,
  billableSeats = 0,
  onSelect
}: PlanCardProps) {
  const config = getPlanConfig(plan.name);
  const Icon = config.icon;
  const isAdmin = useIsAdmin();
  const isPopular = plan.name.toLowerCase() === 'pro';
  const isFree = plan.name.toLowerCase() === 'free';
  const isTeams = plan.name.toLowerCase() === 'teams';
  const isPro = plan.name.toLowerCase() === 'pro';
  
  const { flags: featureFlags, isReady: flagsReady } = useMultipleFeatureFlags([
    'pro_purchases_enabled',
    'teams_purchases_enabled'
  ], true);
  
  const isProDisabledByFlag = flagsReady && isPro && !featureFlags.pro_purchases_enabled;
  const isTeamsDisabledByFlag = flagsReady && isTeams && !featureFlags.teams_purchases_enabled;
  const isDisabledByFlag = isProDisabledByFlag || isTeamsDisabledByFlag;
  
  const getStatus = () => {
    if (isDisabledByFlag) return 'maintenance';
    return 'available';
  };
  
  const status = getStatus();
  const isMaintenanceBlocked = isDisabledByFlag && !isAdmin;

  const getMonthlyEquivalent = () => {
    if (billingPeriod === 'annual') {
      return (plan.annual_amount / 12).toFixed(2);
    }
    return plan.monthly_amount.toFixed(2);
  };

  const getTotalPrice = () => {
    if (billingPeriod === 'annual') {
      return plan.annual_amount.toFixed(2);
    }
    return plan.monthly_amount.toFixed(2);
  };

  const monthlyPrice = getMonthlyEquivalent();
  const totalPrice = getTotalPrice();

  const getButtonText = () => {
    if (isCurrentPlan) return 'Tu plan actual';
    if (!isAuthenticated) return 'Comenzar';
    return `Cambiar a ${plan.name}`;
  };
  
  // Block if plan is not active (based on is_active field from database)
  const isBlocked = plan.is_active === false;

  const getButtonColor = () => {
    if (isCurrentPlan) return undefined;
    if (isFree) return '#84cc16';
    if (plan.name.toLowerCase() === 'pro') return '#0047AB';
    if (isTeams) return '#8B5CF6';
    return undefined;
  };

  return (
    <ComingSoonCard status={status}>
      <div
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
        <div className={cn(
          "text-xs leading-relaxed min-h-[36px]",
          isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
        )}>
          {config.cardHeader}
        </div>

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

        <div className="py-2">
          {isDisabledByFlag ? (
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-5xl font-bold tracking-tight",
                isPopular ? "text-gray-500" : "text-muted-foreground"
              )}>
                $—
              </span>
              <span className={cn(
                "text-sm ml-2",
                isPopular ? "text-gray-500" : "text-muted-foreground"
              )}>
                No disponible
              </span>
            </div>
          ) : isFree ? (
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
                  "text-5xl font-bold tracking-tight flex items-baseline gap-1",
                  isPopular ? "text-white" : "text-[var(--text-default)]"
                )}>
                  <span className="text-2xl font-normal">$</span>
                  {monthlyPrice}
                </span>
                <span className={cn(
                  "text-lg",
                  isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                )}>
                  por mes
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
              {plan.billing_type === 'per_user' && isTeams && (
                <>
                  <div className={cn(
                    "text-xs mt-0.5",
                    isPopular ? "text-gray-500" : "text-[var(--text-muted)]"
                  )}>
                    Por usuario/asiento
                  </div>
                  {billableSeats > 0 && (
                    <div className={cn(
                      "text-xs mt-1 font-medium",
                      isPopular ? "text-gray-400" : "text-[var(--text-muted)]"
                    )}>
                      Costo estimado: USD {(billableSeats * Number(monthlyPrice)).toFixed(2)}/mes
                      <span className="text-[10px] ml-1">
                        ({billableSeats} miembro{billableSeats > 1 ? 's' : ''} × ${monthlyPrice})
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <BlockedRestricted
          isBlocked={isBlocked && !isCurrentPlan}
          title="Plan no disponible"
          message="Este plan no está disponible para suscripción en este momento."
        >
          <Button
            className={cn(
              "w-full h-11 font-medium rounded-lg",
              !isCurrentPlan && getButtonColor() ? "text-white hover:opacity-90" : ""
            )}
            style={
              !isCurrentPlan && getButtonColor()
                ? { backgroundColor: getButtonColor() }
                : undefined
            }
            variant={isCurrentPlan ? "outline" : "default"}
            onClick={() => onSelect(plan)}
            disabled={isCurrentPlan || isMaintenanceBlocked}
            data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
          >
            {getButtonText()}
          </Button>
        </BlockedRestricted>

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
    </ComingSoonCard>
  );
}
