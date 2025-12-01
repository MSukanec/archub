import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { RestrictionOverlay } from "../ui/RestrictionOverlay";
import { Crown, Beaker } from "lucide-react";

interface RoleRestrictedProps {
  requiredRole: "admin" | "founder" | "lab_user";
  hideCompletely?: boolean;
  showAsPreview?: boolean;
  children: React.ReactNode;
}

export function RoleRestricted({
  requiredRole,
  hideCompletely = false,
  showAsPreview = false,
  children,
}: RoleRestrictedProps) {
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();

  const hasRequiredRole = useMemo(() => {
    switch (requiredRole) {
      case "admin":
        return isAdmin;
      case "founder":
        return userData?.organization?.settings?.is_founder === true;
      case "lab_user":
        return isAdmin;
      default:
        return false;
    }
  }, [requiredRole, isAdmin, userData?.organization?.settings?.is_founder]);

  const getRoleInfo = () => {
    switch (requiredRole) {
      case "admin":
        return {
          title: "Solo para Administradores",
          description: "Solo los administradores del sistema pueden acceder a esto.",
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

  // Si el admin tiene acceso, mostrar con el overlay visual (estilo "Coming Soon") pero permitir interacción
  if (hasRequiredRole) {
    if (showAsPreview) {
      return <div className="opacity-40">{children}</div>;
    }
    // Admin ve el overlay visual pero puede interactuar (sin pointer-events-none)
    return (
      <div className="relative w-full">
        <div className="relative w-full opacity-50">
          {children}
        </div>
        <RestrictionOverlay
          icon={roleInfo.icon}
          title={roleInfo.title}
          description={roleInfo.description}
          allowInteraction={true}
        />
      </div>
    );
  }

  if (hideCompletely) {
    return null;
  }

  // Usuarios sin acceso: overlay visual + bloqueado
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
