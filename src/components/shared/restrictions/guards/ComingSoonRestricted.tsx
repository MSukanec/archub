import React from "react";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  return (
    <div className="relative w-full inline-block overflow-visible cursor-not-allowed">
      {/* Overlay invisible que bloquea clicks */}
      <div className="absolute inset-0 pointer-events-auto z-10" />
      
      {/* Contenido con blur */}
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
      
      {/* Badge PROXIMAMENTE en el centro */}
      <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none">
        <div className="bg-black rounded px-2 py-1 flex items-center justify-center">
          <span className="text-xs font-bold text-white">PRÓXIMAMENTE</span>
        </div>
      </div>
    </div>
  );
}

export default ComingSoonRestricted;
