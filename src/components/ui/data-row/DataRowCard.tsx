import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type Density = 'compact' | 'normal' | 'comfortable';

export interface DataRowCardProps {
  /** Contenido de las columnas */
  children: React.ReactNode;
  
  /** Avatar en la primera columna (opcional) */
  avatarUrl?: string;
  avatarFallback?: string;
  
  /** Checkbox de selección (opcional) */
  selectable?: boolean;
  selected?: boolean;

  /** Layout */
  columns?: 2 | 3;  // por defecto 3 (avatar + content + trailing), si no hay avatar se auto-reduce a 2
  
  /** Visual */
  borderColor?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  activeBorder?: boolean; // Borde activo con color --accent

  /** Comportamiento */
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  density?: Density;
  className?: string;
  'data-testid'?: string;
}

// Helper para obtener clases de color del borde
const getBorderColorClass = (color?: string): string => {
  switch (color) {
    case 'success':
      return 'border-r-4 border-r-green-500';
    case 'danger':
      return 'border-r-4 border-r-red-500';
    case 'warning':
      return 'border-r-4 border-r-yellow-500';
    case 'info':
      return 'border-r-4 border-r-blue-500';
    case 'neutral':
      return 'border-r-4 border-r-gray-400';
    default:
      return '';
  }
};

// Mapeo de density a clases
const getDensityClasses = (density: Density = 'normal') => {
  switch (density) {
    case 'compact':
      return {
        container: 'py-2 gap-2',
        avatar: 'h-8 w-8',
      };
    case 'comfortable':
      return {
        container: 'py-4 gap-4',
        avatar: 'h-12 w-12',
      };
    default: // normal
      return {
        container: 'py-3 gap-3',
        avatar: 'h-10 w-10',
      };
  }
};

const LoadingSkeleton: React.FC<{ density: Density }> = ({ density }) => {
  const classes = getDensityClasses(density);
  
  return (
    <div className={cn('flex items-center gap-3', classes.container)}>
      {/* Avatar */}
      <div className={classes.avatar} style={{ background: '#f1f5f9', borderRadius: '50%' }}></div>
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-3 bg-muted rounded w-3/4"></div>
      </div>
      
      {/* Trailing */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-16"></div>
        <div className="h-3 bg-muted rounded w-12"></div>
      </div>
    </div>
  );
};

export default function DataRowCard({
  children,
  avatarUrl,
  avatarFallback,
  selectable,
  selected,
  columns = 3,
  borderColor,
  activeBorder,
  onClick,
  disabled = false,
  loading = false,
  density = 'normal',
  className,
  'data-testid': testId
}: DataRowCardProps) {
  const classes = getDensityClasses(density);
  
  // Determinar si es interactivo
  const isInteractive = onClick && !disabled;
  
  // Auto-ajustar columnas si no hay avatar
  const hasAvatar = !!(avatarUrl || avatarFallback);
  
  // Manejar eventos de teclado para accesibilidad
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn(
          'w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 shadow-lg',
          className
        )}
        data-testid={testId}
      >
        <LoadingSkeleton density={density} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 mb-3 transition-colors shadow-lg',
        classes.container,
        // Estados interactivos
        isInteractive && 'cursor-pointer hover:bg-[var(--card-hover-bg)] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        // Estado disabled
        disabled && 'opacity-60 cursor-not-allowed',
        // Estado selected
        selected && 'ring-2 ring-accent',
        // Color del borde lateral
        getBorderColorClass(borderColor),
        // Borde activo con --accent - aplicado con style
        activeBorder && 'border-2 shadow-md',
        className
      )}
      style={activeBorder ? { borderColor: 'hsl(76, 100%, 40%)' } : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox para selección */}
        {selectable && (
          <div className="flex-shrink-0">
            <div className={cn(
              'flex items-center justify-center w-4 h-4 border-2 rounded',
              selected 
                ? 'bg-accent border-accent text-accent-foreground' 
                : 'border-muted-foreground'
            )}>
              {selected && <Check className="h-3 w-3" />}
            </div>
          </div>
        )}

        {/* Avatar (primera columna si existe) */}
        {hasAvatar && (
          <Avatar className={classes.avatar}>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs font-medium">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Contenido - Los hijos manejan su propio layout */}
        {children}
      </div>
    </div>
  );
}