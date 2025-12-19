import { useLocation } from "wouter";
import { Crown, Users, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanType = 'free' | 'pro' | 'teams' | 'enterprise';

interface PlanBadgeProps {
  planName?: string | null;
  className?: string;
}

const planConfig: Record<PlanType, { 
  icon: React.ComponentType<{ className?: string }>;
  colorVar: string;
  label: string;
}> = {
  free: {
    icon: Sparkles,
    colorVar: '--plan-free',
    label: 'Plan Free'
  },
  pro: {
    icon: Crown,
    colorVar: '--plan-pro',
    label: 'Plan Pro'
  },
  teams: {
    icon: Users,
    colorVar: '--plan-teams',
    label: 'Plan Teams'
  },
  enterprise: {
    icon: Building2,
    colorVar: '--plan-enterprise',
    label: 'Plan Enterprise'
  }
};

function getPlanType(planName: string | null | undefined): PlanType {
  if (!planName) return 'free';
  const normalized = planName.toLowerCase().trim();
  if (normalized.includes('enterprise')) return 'enterprise';
  if (normalized.includes('teams')) return 'teams';
  if (normalized.includes('pro')) return 'pro';
  return 'free';
}

export function PlanBadge({ planName, className }: PlanBadgeProps) {
  const [, navigate] = useLocation();
  
  const planType = getPlanType(planName);
  const config = planConfig[planType];
  const Icon = config.icon;

  const handleClick = () => {
    navigate('/settings/pricing-plan');
  };

  return (
    <button
      onClick={handleClick}
      title={config.label}
      data-testid="button-plan-badge"
      className={cn(
        "h-8 w-8 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center",
        "hover:scale-105 hover:opacity-90",
        className
      )}
      style={{ backgroundColor: `var(${config.colorVar})` }}
    >
      <Icon className="h-4 w-4 text-white" />
    </button>
  );
}
