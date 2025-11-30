import React from "react";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  const isAdmin = useIsAdmin();

  // Admin sees it normally
  if (isAdmin) {
    return <>{children}</>;
  }

  // Regular users see it semi-transparent and disabled
  return (
    <div className="opacity-40 pointer-events-none">
      {children}
    </div>
  );
}

export default ComingSoonRestricted;
