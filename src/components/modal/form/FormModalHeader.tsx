import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowLeft, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModalReadinessState } from '../utils/modal-readiness';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  current?: boolean;
}

interface FormModalHeaderProps {
  // PROPIEDADES EXISTENTES MEJORADAS
  /** Título principal del modal */
  title?: string;
  /** Descripción o subtítulo */
  description?: string;
  /** Icono representativo del modal */
  icon?: LucideIcon;
  /** Acciones personalizadas a la izquierda */
  leftActions?: ReactNode;
  /** Acciones personalizadas a la derecha */
  rightActions?: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Mostrar botón de retroceso */
  showBackButton?: boolean;
  /** Callback para botón de retroceso */
  onBackClick?: () => void;
  
  // NUEVAS PROPIEDADES AVANZADAS
  
  /** Estado de readiness del modal */
  readinessState?: ModalReadinessState;
  
  /** Breadcrumb para navegación jerárquica */
  breadcrumbs?: BreadcrumbItem[];
  
  /** Separador personalizado para breadcrumbs */
  breadcrumbSeparator?: ReactNode;
  
  /** Estado del proceso/formulario */
  status?: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  
  /** Mensaje de estado personalizado */
  statusMessage?: string;
  
  /** Indicador de progreso (para modales de múltiples pasos) */
  progress?: {
    current: number;
    total: number;
    showNumbers?: boolean;
    showPercentage?: boolean;
  };
  
  /** ID único del header para accessibility */
  headerId?: string;
  
  /** Nivel de heading para accessibility (h1, h2, etc) */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Elementos de estado/badges adicionales */
  statusBadges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    icon?: LucideIcon;
  }>;
  
  /** Acciones de teclado personalizadas */
  keyboardActions?: Array<{
    key: string;
    label: string;
    action: () => void;
    modifiers?: ('ctrl' | 'shift' | 'alt')[];
  }>;
  
  /** Mostrar atajos de teclado en tooltip */
  showKeyboardShortcuts?: boolean;
  
  /** Texto del botón de retroceso personalizado */
  backButtonText?: string;
  
  /** Variante del botón de retroceso */
  backButtonVariant?: 'default' | 'ghost' | 'outline' | 'secondary';
  
  /** Deshabilitar todas las acciones (durante loading) */
  disabled?: boolean;
  
  /** Callback cuando se hace click en el título (para casos especiales) */
  onTitleClick?: () => void;
  
  /** Mostrar indicador de modo edición */
  isEditing?: boolean;
  
  /** Callback para alternar modo edición */
  onToggleEdit?: () => void;
}

export function FormModalHeader({
  // Propiedades existentes
  title,
  description,
  icon: Icon,
  leftActions,
  rightActions,
  className,
  showBackButton,
  onBackClick,
  
  // Nuevas propiedades avanzadas
  readinessState,
  breadcrumbs = [],
  breadcrumbSeparator = '/',
  status = 'idle',
  statusMessage,
  progress,
  headerId = `modal-header-${Date.now()}`,
  headingLevel = 2,
  statusBadges = [],
  keyboardActions = [],
  showKeyboardShortcuts = false,
  backButtonText = 'Volver',
  backButtonVariant = 'ghost',
  disabled = false,
  onTitleClick,
  isEditing = false,
  onToggleEdit,
}: FormModalHeaderProps) {
  
  // DETERMINAR ICONO DE ESTADO
  const getStatusIcon = () => {
    if (readinessState && readinessState.isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return Icon ? <Icon className="h-4 w-4 text-[var(--accent)]" /> : null;
    }
  };

  // CREAR ELEMENTO DE HEADING DINÁMICO
  const HeadingComponent = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  
  // MANEJO DE TECLADO PERSONALIZADO
  React.useEffect(() => {
    if (keyboardActions.length === 0) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const action of keyboardActions) {
        const modifiersMatch = action.modifiers?.every(mod => {
          switch (mod) {
            case 'ctrl': return event.ctrlKey;
            case 'shift': return event.shiftKey;
            case 'alt': return event.altKey;
            default: return false;
          }
        }) ?? true;
        
        if (event.key === action.key && modifiersMatch && !disabled) {
          event.preventDefault();
          action.action();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardActions, disabled]);

  return (
    <header 
      className={cn(
        "px-3 py-3 border-b border-[var(--card-border)]",
        "bg-[var(--card-bg)]",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
      role="banner"
      aria-labelledby={headerId}
    >
      {/* BREADCRUMBS */}
      {breadcrumbs.length > 0 && (
        <nav 
          aria-label="Breadcrumb" 
          className="mb-2"
          role="navigation"
        >
          <ol className="flex items-center space-x-1 text-xs text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-1" aria-hidden="true">
                    {breadcrumbSeparator}
                  </span>
                )}
                {item.onClick && !item.disabled ? (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      item.current && "text-foreground font-medium"
                    )}
                    aria-current={item.current ? 'page' : undefined}
                    disabled={disabled}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span 
                    className={cn(
                      item.current && "text-foreground font-medium",
                      item.disabled && "opacity-50"
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* BOTÓN DE RETROCESO */}
          {showBackButton && onBackClick && (
            <Button
              variant={backButtonVariant}
              size="sm"
              onClick={onBackClick}
              className="flex items-center gap-2 shrink-0"
              disabled={disabled}
              data-testid="modal-back-button"
              aria-label={`${backButtonText} - Navegar al paso anterior`}
            >
              <ArrowLeft className="h-4 w-4" />
              {backButtonText}
            </Button>
          )}

          {/* ACCIONES IZQUIERDA */}
          {leftActions && <div className="shrink-0">{leftActions}</div>}

          {/* TÍTULO Y DESCRIPCIÓN */}
          {title && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* ICONO DE ESTADO */}
              <div className="shrink-0">
                {getStatusIcon()}
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <HeadingComponent 
                    id={headerId}
                    className={cn(
                      "text-sm font-medium text-[var(--card-fg)] truncate",
                      onTitleClick && "cursor-pointer hover:text-[var(--accent)] transition-colors"
                    )}
                    onClick={onTitleClick}
                    title={title}
                  >
                    {title}
                  </HeadingComponent>
                  
                  {/* INDICADOR DE EDICIÓN */}
                  {isEditing && (
                    <Badge variant="outline" className="text-xs">
                      Editando
                    </Badge>
                  )}
                </div>
                
                {/* DESCRIPCIÓN */}
                {description && (
                  <p 
                    className="text-xs text-[var(--text-muted)] leading-tight mt-0.5 line-clamp-2"
                    title={description}
                  >
                    {description}
                  </p>
                )}
                
                {/* MENSAJE DE ESTADO */}
                {statusMessage && (
                  <p 
                    className={cn(
                      "text-xs leading-tight mt-1",
                      status === 'error' && "text-red-600",
                      status === 'success' && "text-green-600",
                      status === 'warning' && "text-orange-600",
                      status === 'loading' && "text-blue-600",
                      status === 'idle' && "text-muted-foreground"
                    )}
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN DERECHA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PROGRESO */}
          {progress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {progress.showNumbers && (
                <span>{progress.current}/{progress.total}</span>
              )}
              {progress.showPercentage && (
                <span>({Math.round((progress.current / progress.total) * 100)}%)</span>
              )}
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* BADGES DE ESTADO */}
          {statusBadges.map((badge, index) => (
            <Badge 
              key={index} 
              variant={badge.variant || 'default'}
              className="text-xs flex items-center gap-1"
            >
              {badge.icon && <badge.icon className="h-3 w-3" />}
              {badge.label}
            </Badge>
          ))}

          {/* BOTÓN TOGGLE EDICIÓN */}
          {onToggleEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
              disabled={disabled}
              className="text-xs"
              data-testid="toggle-edit-button"
              aria-label={isEditing ? 'Salir del modo edición' : 'Entrar en modo edición'}
            >
              {isEditing ? 'Ver' : 'Editar'}
            </Button>
          )}

          {/* ACCIONES DERECHA */}
          {rightActions && <div>{rightActions}</div>}

          {/* ATAJOS DE TECLADO (SI ESTÁN HABILITADOS) */}
          {showKeyboardShortcuts && keyboardActions.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" disabled className="text-xs px-2">
                <Info className="h-3 w-3 mr-1" />
                Atajos disponibles
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* INDICADOR DE READINESS ERROR */}
      {readinessState?.hasError && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
          <AlertCircle className="h-3 w-3" />
          <span>Error al cargar datos del modal</span>
          {readinessState.retryQueries && (
            <button
              onClick={readinessState.retryQueries}
              className="underline hover:no-underline"
              disabled={disabled}
            >
              Reintentar
            </button>
          )}
        </div>
      )}
    </header>
  );
}