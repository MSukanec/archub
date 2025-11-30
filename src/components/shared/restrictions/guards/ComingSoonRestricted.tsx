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
      <div className="blur-[0.5px] pointer-events-none">
        {children}
      </div>
      
      {/* Badge PROXIMAMENTE super pequeño, negro con texto blanco */}
      <div className="absolute -bottom-0.5 -right-0.5 bg-black rounded px-1 py-0.5 flex items-center justify-center z-[9999] shadow-lg pointer-events-none">
        <span className="text-[0.5rem] font-bold text-white">PRÓXIMAMENTE</span>
      </div>
    </div>
  );
}

export default ComingSoonRestricted;
