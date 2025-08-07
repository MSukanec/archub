import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Star, Crown, Zap } from "lucide-react";

interface CurrentPlanProps {
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showUpgradeButton?: boolean;
}

export function CurrentPlan({ 
  expanded = false, 
  size = 'medium',
  className,
  showUpgradeButton = true
}: CurrentPlanProps) {
  const { data: userData } = useCurrentUser();

  const sizeClasses = {
    small: {
      container: "p-2",
      icon: "w-4 h-4",
      iconContainer: "w-4 h-4",
      title: "text-xs",
      planName: "text-sm",
      description: "text-xs",
      button: "py-1 px-2 text-xs",
      buttonIcon: "w-3 h-3"
    },
    medium: {
      container: "p-3",
      icon: "w-5 h-5",
      iconContainer: "w-5 h-5",
      title: "text-xs",
      planName: "text-sm",
      description: "text-xs",
      button: "py-2 px-3 text-xs",
      buttonIcon: "w-3 h-3"
    },
    large: {
      container: "p-4",
      icon: "w-6 h-6",
      iconContainer: "w-6 h-6",
      title: "text-sm",
      planName: "text-base",
      description: "text-sm",
      button: "py-3 px-4 text-sm",
      buttonIcon: "w-4 h-4"
    }
  };

  const styles = sizeClasses[size];

  if (!expanded) {
    return (
      <div className={cn(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-150 ease-out hover:scale-105",
        (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "border-[var(--plan-free-bg)]",
        userData?.plan?.name?.toLowerCase() === 'pro' && "border-[var(--plan-pro-bg)]",
        userData?.plan?.name?.toLowerCase() === 'teams' && "border-[var(--plan-teams-bg)]",
        className
      )}>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full border-2 rounded-lg transition-all duration-150 ease-out",
      (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "border-[var(--plan-free-bg)]",
      userData?.plan?.name?.toLowerCase() === 'pro' && "border-[var(--plan-pro-bg)]",
      userData?.plan?.name?.toLowerCase() === 'teams' && "border-[var(--plan-teams-bg)]",
      styles.container,
      className
    )}>
        <div className={cn(
          "rounded-full border-2 bg-white flex items-center justify-center transition-all duration-150",
          styles.iconContainer
        )}>
          {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && <Star className={cn(styles.icon, "text-[var(--plan-free-bg)]")} />}
          {userData?.plan?.name?.toLowerCase() === 'pro' && <Crown className={cn(styles.icon, "text-[var(--plan-pro-bg)]")} />}
          {userData?.plan?.name?.toLowerCase() === 'teams' && <Zap className={cn(styles.icon, "text-[var(--plan-teams-bg)]")} />}
        </div>
        <span className={cn(styles.title, "font-medium text-gray-600")}>Plan actual:</span>
      </div>
      
        <span className={cn(
          styles.planName,
          "font-semibold capitalize",
          (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "text-[var(--plan-free-bg)]",
          userData?.plan?.name?.toLowerCase() === 'pro' && "text-[var(--plan-pro-bg)]",
          userData?.plan?.name?.toLowerCase() === 'teams' && "text-[var(--plan-teams-bg)]"
        )}>
          {userData?.plan?.name || 'Free'}
        </span>
      </div>
      
      <p className={cn(
        styles.description,
        "text-gray-500 mb-3 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.15s_forwards]"
      )}>
        {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
        {userData?.plan?.name?.toLowerCase() === 'pro' && "Todas las funcionalidades profesionales"}
        {userData?.plan?.name?.toLowerCase() === 'teams' && "Máximo rendimiento para equipos"}
      </p>
      
      {showUpgradeButton && (
        <>
          {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && (
            <button className={cn(
              "w-full rounded-lg font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]",
              "bg-[var(--plan-free-bg)] hover:bg-[var(--plan-free-bg)]/80",
              styles.button
            )}>
              <Zap className={styles.buttonIcon} />
              Actualizar a Pro
            </button>
          )}
          {userData?.plan?.name?.toLowerCase() === 'pro' && (
            <button 
              className={cn(
                "w-full rounded-lg font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]",
                styles.button
              )}
              style={{backgroundColor: 'var(--plan-pro-bg)'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(213, 100%, 28%)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--plan-pro-bg)'}
            >
              <Crown className={styles.buttonIcon} />
              Actualizar a Teams
            </button>
          )}
          {userData?.plan?.name?.toLowerCase() === 'teams' && (
            <button 
              className={cn(
                "w-full rounded-lg font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]",
                styles.button
              )}
              style={{backgroundColor: 'var(--plan-teams-bg)'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(271, 76%, 48%)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--plan-teams-bg)'}
            >
              <Zap className={styles.buttonIcon} />
              Plan Premium
            </button>
          )}
        </>
      )}
    </div>
  );
}