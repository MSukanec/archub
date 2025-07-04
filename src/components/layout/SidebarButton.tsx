import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  avatarUrl?: string;
  rightIcon?: React.ReactNode;
  isChild?: boolean;
  showArrow?: boolean;
}

export default function SidebarButton({ 
  icon, 
  label, 
  isActive, 
  isExpanded, 
  onClick,
  avatarUrl,
  rightIcon,
  isChild = false,
  showArrow = false
}: SidebarButtonProps) {
  return (
    <button
      className={cn(
        'relative flex items-center justify-center transition-all duration-300 rounded-md mb-0.5',
        // Botón SIEMPRE 32x32px (w-8 h-8), perfectamente centrado
        'w-8 h-8 mx-auto',
        // Cuando expandido, el botón se extiende a full width
        isExpanded && 'w-full justify-start mx-0',
        isActive 
          ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' 
          : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
      )}
      onClick={onClick}
      title={!isExpanded ? label : undefined}
    >
      {/* Contenedor del icono - SIEMPRE centrado en 32x32px, no mostrar para hijos */}
      {!isChild && (
        <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar"
              className="w-[18px] h-[18px] rounded-full"
            />
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Texto - solo cuando expandido */}
      {isExpanded && (
        <div className={cn(
          "flex items-center justify-between w-full",
          isChild ? "ml-2" : "ml-8" // Menos margen para elementos hijos
        )}>
          <span className="text-sm font-medium whitespace-nowrap text-left transition-opacity duration-300 delay-100">
            {label}
          </span>
          {(rightIcon || showArrow) && (
            <div className="flex-shrink-0 ml-2">
              {rightIcon || (showArrow && <svg className="h-3 w-3 text-[--muted-fg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>)}
            </div>
          )}
        </div>
      )}
    </button>
  );
}