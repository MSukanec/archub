import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type Density = 'compact' | 'normal' | 'comfortable';

export type Line = {
  /** Texto principal de la línea (puede incluir valores dinámicos) */
  text: string;
  /** Color semántico opcional: 'muted' | 'success' | 'warning' | 'danger' | 'info' */
  tone?: 'muted' | 'success' | 'warning' | 'danger' | 'info';
  /** hint pequeño a la derecha (ej. código de moneda, %), opcional */
  hintRight?: string;
  /** si true, renderizar como monoespaciado (importe) */
  mono?: boolean;
};

export interface DataRowCardProps {
  /** Leading slot */
  avatarUrl?: string;
  avatarFallback?: string;        // ej: "A"
  iconName?: string;              // si no hay avatar, usar ícono (lucide)
  selectable?: boolean;           // muestra checkbox a la izquierda
  selected?: boolean;

  /** Content slot */
  title: string;                  // línea principal (negrita)
  subtitle?: string;              // línea secundaria (muted)
  lines?: Line[];                 // hasta 3 líneas auxiliares (validar máx.)

  /** Trailing slot */
  amount?: number;                // importe numérico
  currencyCode?: string;          // ej: ARS, USD
  amountTone?: 'neutral' | 'success' | 'danger'; // color del importe
  badgeText?: string;             // ej: "Pendiente", "Pagado"
  showChevron?: boolean;          // flechita >

  /** Visual */
  borderColor?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'; // color del borde lateral

  /** Comportamiento */
  onClick?: () => void;           // si está presente → cursor-pointer, role="button"
  disabled?: boolean;
  loading?: boolean;
  density?: Density;              // default: 'normal'
  className?: string;
  'data-testid'?: string;
}

// Helper para formatear importes
const formatAmount = (amount: number, currencyCode?: string): string => {
  if (currencyCode) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Mapeo de tones a clases Tailwind
const getToneClasses = (tone?: string): string => {
  switch (tone) {
    case 'muted':
      return 'text-muted-foreground';
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'danger':
      return 'text-red-600 dark:text-red-400';
    case 'info':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-foreground';
  }
};

// Mapeo de density a clases
const getDensityClasses = (density: Density = 'normal') => {
  switch (density) {
    case 'compact':
      return {
        container: 'py-2 gap-2',
        avatar: 'h-8 w-8',
        icon: 'h-4 w-4',
        title: 'text-sm',
        subtitle: 'text-xs',
        line: 'text-xs',
      };
    case 'comfortable':
      return {
        container: 'py-4 gap-4',
        avatar: 'h-12 w-12',
        icon: 'h-6 w-6',
        title: 'text-base',
        subtitle: 'text-sm',
        line: 'text-sm',
      };
    default: // normal
      return {
        container: 'py-3 gap-3',
        avatar: 'h-10 w-10',
        icon: 'h-5 w-5',
        title: 'text-sm font-semibold',
        subtitle: 'text-sm',
        line: 'text-sm',
      };
  }
};

const LoadingSkeleton: React.FC<{ density: Density }> = ({ density }) => {
  const classes = getDensityClasses(density);
  
  return (
    <div className={cn('flex items-center', classes.container)}>
      {/* Avatar skeleton */}
      <div className={cn('rounded-full bg-muted animate-pulse', classes.avatar)} />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </div>
      
      {/* Trailing skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-16" />
        <div className="h-3 bg-muted rounded animate-pulse w-12" />
      </div>
    </div>
  );
};

export default function DataRowCard({
  // Leading props
  avatarUrl,
  avatarFallback,
  iconName,
  selectable = false,
  selected = false,

  // Content props
  title,
  subtitle,
  lines = [],

  // Trailing props
  amount,
  currencyCode,
  amountTone = 'neutral',
  badgeText,
  showChevron = false,

  // Visual props
  borderColor,

  // Behavior props
  onClick,
  disabled = false,
  loading = false,
  density = 'normal',
  className,
  'data-testid': testId,
}: DataRowCardProps) {
  const classes = getDensityClasses(density);
  
  // Limitar lines a máximo 3
  const displayLines = lines.slice(0, 3);
  
  // Determinar si es interactivo
  const isInteractive = onClick && !disabled;
  
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
          'w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4',
          className
        )}
        data-testid={testId}
      >
        <LoadingSkeleton density={density} />
      </div>
    );
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

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 mb-3 transition-colors',
        classes.container,
        // Estados interactivos
        isInteractive && 'cursor-pointer hover:bg-[var(--card-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        // Estado disabled
        disabled && 'opacity-60 cursor-not-allowed',
        // Estado selected
        selected && 'ring-2 ring-accent',
        // Color del borde lateral
        getBorderColorClass(borderColor),
        className
      )}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        {/* Leading Section */}
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

          {/* Avatar o Ícono */}
          {(avatarUrl || avatarFallback) && (
            <Avatar className={classes.avatar}>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs font-medium">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* TODO: Implementar iconName cuando sea necesario */}
          {iconName && !avatarUrl && !avatarFallback && (
            <div className={cn('text-muted-foreground', classes.icon)}>
              {/* Aquí se renderizaría el ícono de lucide basado en iconName */}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={cn('truncate', classes.title)}>
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className={cn('truncate text-muted-foreground', classes.subtitle)}>
              {subtitle}
            </div>
          )}


        </div>

        {/* Trailing Section */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Amount */}
          {amount !== undefined && (
            <div className={cn(
              'font-mono text-sm font-medium',
              getToneClasses(amountTone)
            )}>
              {formatAmount(amount, currencyCode)}
            </div>
          )}

          {/* Lines auxiliares en el trailing */}
          {lines.slice(0, 2).map((line, index) => (
            <div key={index} className="text-right">
              <span className={cn(
                'text-sm',
                getToneClasses(line.tone),
                line.mono && 'font-mono'
              )}>
                {line.text}
              </span>
              {line.hintRight && (
                <span className="text-xs text-muted-foreground ml-2">
                  {line.hintRight}
                </span>
              )}
            </div>
          ))}

          {/* Badge */}
          {badgeText && (
            <div className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              {badgeText}
            </div>
          )}

          {/* Chevron */}
          {showChevron && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}