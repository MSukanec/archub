import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

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

  // Si el admin tiene acceso, mostrar con opacidad (estilo "Coming Soon") pero permitir interacción
  if (hasRequiredRole) {
    return <div className="opacity-40">{children}</div>;
  }

  if (hideCompletely) {
    return null;
  }

  // Usuarios sin acceso: opacidad + bloqueado (igual que ComingSoonRestricted)
  return (
    <div className="opacity-40 pointer-events-none">
      {children}
    </div>
  );
}

export default RoleRestricted;
