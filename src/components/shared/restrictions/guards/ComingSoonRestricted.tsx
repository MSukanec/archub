import React from "react";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { RestrictionOverlay } from "../ui/RestrictionOverlay";
import { Sparkles } from "lucide-react";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  const isAdmin = useIsAdmin();

  // Both admin and regular users see it blocked, but admin can interact
  return (
    <div className={`relative w-full ${isAdmin ? '' : 'pointer-events-none'}`}>
      <div className="relative w-full opacity-50">
        {children}
      </div>
      <RestrictionOverlay
        icon={<Sparkles className="w-6 h-6 text-blue-500" />}
        title="Próximamente"
        description="Esta función estará disponible pronto."
      />
    </div>
  );
}

export default ComingSoonRestricted;
