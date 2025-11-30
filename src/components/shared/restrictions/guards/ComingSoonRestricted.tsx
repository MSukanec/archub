import React from "react";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  return (
    <div className="opacity-50 pointer-events-none cursor-not-allowed">
      {children}
    </div>
  );
}

export default ComingSoonRestricted;
