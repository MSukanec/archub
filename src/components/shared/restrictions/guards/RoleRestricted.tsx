import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { RestrictionOverlay } from "../ui/RestrictionOverlay";
import { Crown, Beaker } from "lucide-react";

interface RoleRestrictedProps {
  requiredRole: "admin" | "founder" | "lab_user";
  hideCompletely?: boolean;
  children: React.ReactNode;
}

export function RoleRestricted({
  requiredRole,
  hideCompletely = false,
  children,
}: RoleRestrictedProps) {
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();

  // Check if user has required role
  const hasRequiredRole = useMemo(() => {
    switch (requiredRole) {
      case "admin":
        return isAdmin;
      case "founder":
        return userData?.organization?.settings?.is_founder === true;
      case "lab_user":
        // Can be expanded later with actual lab_user check
        return isAdmin;
      default:
        return false;
    }
  }, [requiredRole, isAdmin, userData?.organization?.settings?.is_founder]);

  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // If hideCompletely is true, don't render anything
  if (hideCompletely) {
    return null;
  }

  // Prepare restriction message based on role
  const getRoleInfo = () => {
    switch (requiredRole) {
      case "admin":
        return {
          title: "Solo para Administradores",
          description: "Solo los administradores de la organización pueden acceder a esto.",
          icon: <Crown className="w-6 h-6 text-amber-500" />,
        };
      case "founder":
        return {
          title: "Exclusiva para Fundadores",
          description: "Funcionalidad exclusiva para organizaciones fundadoras.",
          icon: <Crown className="w-6 h-6 text-yellow-500" />,
        };
      case "lab_user":
        return {
          title: "En Laboratorio",
          description: "Esta función está en fase experimental. Solo usuarios de laboratorio pueden acceder.",
          icon: <Beaker className="w-6 h-6 text-purple-500" />,
        };
      default:
        return {
          title: "Acceso Restringido",
          description: "No tienes permiso para acceder a esto.",
          icon: <Crown className="w-6 h-6" />,
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="relative w-full">
      <div className="relative w-full opacity-50 pointer-events-none">
        {children}
      </div>
      <RestrictionOverlay
        icon={roleInfo.icon}
        title={roleInfo.title}
        description={roleInfo.description}
      />
    </div>
  );
}

export default RoleRestricted;
