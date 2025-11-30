import React from "react";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  const isAdmin = useIsAdmin();

  // Admin can always access
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="opacity-50 pointer-events-none cursor-not-allowed">
      {children}
    </div>
  );
}

export default ComingSoonRestricted;
