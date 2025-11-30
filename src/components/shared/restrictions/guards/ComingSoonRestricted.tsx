import React from "react";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  return (
    <div className="relative w-full inline-block overflow-visible cursor-not-allowed">
      {/* Overlay invisible que bloquea clicks */}
      <div className="absolute inset-0 pointer-events-auto z-10" />
      
      {/* Contenido con blur mínimo */}
      <div className="blur-[0.75px] pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default ComingSoonRestricted;
