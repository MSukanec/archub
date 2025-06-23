import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  avatarUrl?: string;
}

export default function SidebarButton({ 
  icon, 
  label, 
  isActive, 
  isExpanded, 
  onClick,
  avatarUrl 
}: SidebarButtonProps) {
  return (
    <button
      className={cn(
        'relative flex items-center transition-all duration-300',
        // Botón SIEMPRE 32x32px (w-8 h-8), centrado cuando colapsado
        'w-8 h-8',
        // Cuando expandido, el botón se extiende pero el icono queda fijo
        isExpanded && 'w-full',
        isActive 
          ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' 
          : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
      )}
      onClick={onClick}
      title={!isExpanded ? label : undefined}
      style={{ borderRadius: '4px' }}
    >
      {/* Contenedor del icono - SIEMPRE centrado en 32x32px */}
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
      
      {/* Texto - solo cuando expandido, empieza después del icono */}
      {isExpanded && (
        <span className="ml-8 text-sm font-medium whitespace-nowrap text-left transition-opacity duration-300 delay-100">{label}</span>
      )}
    </button>
  );
}