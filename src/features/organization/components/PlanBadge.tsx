import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Crown, Users } from "lucide-react";
import { useProjectContext } from "@/stores/projectContext";

interface PlanBadgeProps {
  isExpanded: boolean;
}

export default function PlanBadge({ isExpanded }: PlanBadgeProps) {
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  const { currentOrganizationId } = useProjectContext();

  // Fetch current organization to get its plan
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;
      const response = await fetch(`/api/organizations/${currentOrganizationId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!currentOrganizationId,
  });

  // Colors from index.css
  const planColors = {
    free: '#84cc16',      // --plan-free: hsl(76, 100%, 40%)
    pro: '#1a57a0',       // --plan-pro: hsl(213, 100%, 33%)
    teams: '#8b5cf6'      // --plan-teams: hsl(271, 76%, 53%)
  };

  // Get plan from organization, fallback to user plan
  const organizationPlan = organizationData?.subscription?.plan || organizationData?.plan;
  const currentPlan = organizationPlan?.name?.toLowerCase() || userData?.plan?.name?.toLowerCase() || 'free';
  const bgColor = planColors[currentPlan as keyof typeof planColors];
  const borderColor = planColors[currentPlan as keyof typeof planColors];

  return (
    <div className="flex justify-center w-full">
      <div className={cn(
        "transition-all duration-150 ease-out",
        isExpanded ? "w-full" : "w-8 h-8"
      )}>
        {isExpanded ? (
          <div 
            className="w-full border-2 rounded-lg p-3 transition-all duration-150 ease-out"
            style={{ borderColor }}
          >
            <div className="flex items-center gap-2 mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.05s_forwards]">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
                style={{ backgroundColor: bgColor }}
              >
                {currentPlan === 'free' && <Star className="w-3 h-3 text-white" />}
                {currentPlan === 'pro' && <Crown className="w-3 h-3 text-white" />}
                {currentPlan === 'teams' && <Users className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs font-medium text-[var(--main-sidebar-fg)]">Plan actual:</span>
            </div>
            <div className="mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.1s_forwards]">
              <span 
                className="text-sm font-semibold capitalize"
                style={{ color: 'var(--text-important)' }}
              >
                {currentPlan === 'free' ? 'Free' : currentPlan === 'pro' ? 'Pro' : 'Teams'}
              </span>
            </div>
            <p className="text-xs text-[var(--main-sidebar-fg)] mb-3 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.15s_forwards]">
              {currentPlan === 'free' && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
              {currentPlan === 'pro' && "Todas las funcionalidades profesionales"}
              {currentPlan === 'teams' && "Máximo rendimiento para equipos"}
            </p>
            {currentPlan === 'free' && (
              <button 
                onClick={() => navigate('/settings/pricing-plan')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]"
                style={{backgroundColor: planColors.free}}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <Zap className="w-3 h-3" />
                Actualizar a Pro
              </button>
            )}
            {currentPlan === 'pro' && (
              <button 
                onClick={() => navigate('/settings/pricing-plan')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]" 
                style={{backgroundColor: planColors.pro}}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <Crown className="w-3 h-3" />
                Actualizar a Teams
              </button>
            )}
            {currentPlan === 'teams' && (
              <button 
                onClick={() => navigate('/settings/pricing-plan')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]" 
                style={{backgroundColor: planColors.teams}}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <Users className="w-3 h-3" />
                Plan Premium
              </button>
            )}
          </div>
        ) : (
          <div 
            onClick={() => navigate('/settings/pricing-plan')}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 ease-out hover:scale-105"
            style={{backgroundColor: bgColor}}
          >
            {currentPlan === 'free' && <Star className="w-4 h-4 text-white transition-all duration-150" />}
            {currentPlan === 'pro' && <Crown className="w-4 h-4 text-white transition-all duration-150" />}
            {currentPlan === 'teams' && <Users className="w-4 h-4 text-white transition-all duration-150" />}
          </div>
        )}
      </div>
    </div>
  );
}