import { Clock, Wrench, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import type { ItemStatus } from "@shared/schema";

interface ComingSoonCardProps {
  status: ItemStatus;
  children: React.ReactNode;
  className?: string;
  showBadge?: boolean;
}

const statusConfig = {
  available: {
    icon: CheckCircle,
    label: "Disponible",
    badgeClass: "bg-green-500 text-white border-0",
    isBlocking: false,
  },
  coming_soon: {
    icon: Clock,
    label: "Próximamente",
    badgeClass: "bg-blue-500 text-white border-0",
    isBlocking: true,
  },
  maintenance: {
    icon: Wrench,
    label: "En mantenimiento",
    badgeClass: "bg-amber-500 text-white border-0",
    isBlocking: true,
  },
} as const;

export function ComingSoonCard({
  status,
  children,
  className,
  showBadge = true,
}: ComingSoonCardProps) {
  const isAdmin = useIsAdmin();
  const config = statusConfig[status];

  if (!config) {
    return <>{children}</>;
  }

  const Icon = config.icon;
  const isBlocking = config.isBlocking && !isAdmin;

  return (
    <div
      className={cn("relative", isBlocking && "select-none", className)}
      data-testid={`card-${status}`}
    >
      <div className={cn(isBlocking && "opacity-50 pointer-events-none grayscale-[30%]")}>
        {children}
      </div>
      {showBadge && status !== 'available' && (
        <Badge
          className={cn(
            "absolute top-3 right-3 z-10 text-xs px-2 py-1 shadow-lg pointer-events-none",
            config.badgeClass
          )}
          data-testid={`badge-${status}`}
        >
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      )}
    </div>
  );
}

export default ComingSoonCard;
