import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Star, Crown, Zap } from "lucide-react";

interface PlanBadgeProps {
  isExpanded: boolean;
}

export default function PlanBadge({ isExpanded }: PlanBadgeProps) {
  const { data: userData } = useCurrentUser();

  return (
    <div className="flex justify-center w-full">
      <div className={cn(
        "transition-all duration-150 ease-out",
        isExpanded ? "w-full" : "w-8 h-8"
      )}>
        {isExpanded ? (
          <div className={cn(
            "w-full border-2 rounded-lg p-3 transition-all duration-150 ease-out",
            (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "border-[var(--accent)]",
            userData?.plan?.name?.toLowerCase() === 'pro' && "border-blue-500",
            userData?.plan?.name?.toLowerCase() === 'teams' && "border-purple-500"
          )}>
            <div className="flex items-center gap-2 mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.05s_forwards]">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150",
                (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "bg-[var(--accent)]",
                userData?.plan?.name?.toLowerCase() === 'pro' && "bg-blue-500",
                userData?.plan?.name?.toLowerCase() === 'teams' && "bg-purple-500"
              )}>
                {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && <Star className="w-3 h-3 text-white" />}
                {userData?.plan?.name?.toLowerCase() === 'pro' && <Crown className="w-3 h-3 text-white" />}
                {userData?.plan?.name?.toLowerCase() === 'teams' && <Zap className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs font-medium text-[var(--secondary-sidebar-fg)]">Plan actual:</span>
            </div>
            <div className="mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.1s_forwards]">
              <span className="text-sm font-semibold capitalize text-white">
                {userData?.plan?.name || 'Free'}
              </span>
            </div>
            <p className="text-xs text-[var(--secondary-sidebar-fg)] mb-3 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.15s_forwards]">
              {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
              {userData?.plan?.name?.toLowerCase() === 'pro' && "Todas las funcionalidades profesionales"}
              {userData?.plan?.name?.toLowerCase() === 'teams' && "Máximo rendimiento para equipos"}
            </p>
            {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && (
              <button className={cn(
                "w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]",
                "bg-[var(--plan-free-bg)] hover:bg-[var(--plan-free-bg)]/80"
              )}>
                <Zap className="w-3 h-3" />
                Actualizar a Pro
              </button>
            )}
            {userData?.plan?.name?.toLowerCase() === 'pro' && (
              <button className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]" style={{backgroundColor: 'var(--plan-pro-bg)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(213, 100%, 28%)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--plan-pro-bg)'}>
                <Crown className="w-3 h-3" />
                Actualizar a Teams
              </button>
            )}
            {userData?.plan?.name?.toLowerCase() === 'teams' && (
              <button className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]" style={{backgroundColor: 'var(--plan-teams-bg)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(271, 76%, 48%)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--plan-teams-bg)'}>
                <Zap className="w-3 h-3" />
                Plan Premium
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 ease-out hover:scale-105",
            (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "bg-[var(--plan-free-bg)]",
            userData?.plan?.name?.toLowerCase() === 'pro' && "bg-[var(--plan-pro-bg)]",
            userData?.plan?.name?.toLowerCase() === 'teams' && "bg-[var(--plan-teams-bg)]"
          )}>
            {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && <Star className="w-4 h-4 text-white transition-all duration-150" />}
            {userData?.plan?.name?.toLowerCase() === 'pro' && <Crown className="w-4 h-4 text-white transition-all duration-150" />}
            {userData?.plan?.name?.toLowerCase() === 'teams' && <Zap className="w-4 h-4 text-white transition-all duration-150" />}
          </div>
        )}
      </div>
    </div>
  );
}