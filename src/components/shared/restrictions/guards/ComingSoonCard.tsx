import { Clock, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import type { ItemStatus } from "@shared/schema";

interface ComingSoonCardProps {
  status: ItemStatus;
  children: React.ReactNode;
  className?: string;
}

const statusConfig = {
  available: null,
  coming_soon: {
    icon: Clock,
    label: "Próximamente",
    badgeClass: "bg-amber-500/90 text-white border-0",
  },
  maintenance: {
    icon: Wrench,
    label: "En mantenimiento",
    badgeClass: "bg-slate-500/90 text-white border-0",
  },
} as const;

export function ComingSoonCard({
  status,
  children,
  className,
}: ComingSoonCardProps) {
  const isAdmin = useIsAdmin();
  const config = statusConfig[status];

  if (!config) {
    return <>{children}</>;
  }

  const Icon = config.icon;

  if (isAdmin) {
    return (
      <div className={cn("relative", className)}>
        {children}
        <Badge
          className={cn(
            "absolute top-3 right-3 z-10 text-xs px-2 py-1 shadow-lg pointer-events-none",
            config.badgeClass
          )}
          data-testid={`badge-${status}`}
        >
          <Icon className="w-3 h-3 mr-1" />
          {config.label} (Admin)
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn("relative select-none", className)}
      data-testid={`card-${status}`}
    >
      <div className="opacity-50 pointer-events-none grayscale-[30%]">
        {children}
      </div>
      <Badge
        className={cn(
          "absolute top-3 right-3 z-10 text-xs px-2 py-1 shadow-lg",
          config.badgeClass
        )}
        data-testid={`badge-${status}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    </div>
  );
}

export default ComingSoonCard;
