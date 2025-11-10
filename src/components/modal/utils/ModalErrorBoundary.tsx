import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ModalErrorBoundaryProps {
  children: ReactNode;
  /** Título personalizado para el error */
  fallbackTitle?: string;
  /** Descripción personalizada para el error */
  fallbackDescription?: string;
  /** Callback cuando ocurre un error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Callback cuando se cierra el modal debido a error crítico */
  onClose?: () => void;
  /** Permitir retry del componente */
  allowRetry?: boolean;
  /** Máximo número de retries antes de mostrar error fatal */
  maxRetries?: number;
  /** Mostrar detalles técnicos del error (solo en development) */
  showErrorDetails?: boolean;
}

/**
 * Error boundary específico para modales que proporciona:
 * - Captura de errores de renderizado y hooks
 * - UI de retry elegante 
 * - Logging de errores para debugging
 * - Fallback UI consistente con el diseño de modales
 */
export class ModalErrorBoundary extends Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ModalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ModalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log del error

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Reportar error a servicio de monitoreo (ej: Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Auto-reset después de un tiempo si el error persiste
    this.retryTimeoutId = setTimeout(() => {
      if (this.state.hasError) {
        this.setState({ retryCount: 0 });
      }
    }, 30000); // Reset retry count después de 30 segundos
  };

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const {
      children,
      fallbackTitle = 'Error en el Modal',
      fallbackDescription = 'Ha ocurrido un error inesperado. Puedes intentar recargar o cerrar el modal.',
      allowRetry = true,
      maxRetries = 3,
      showErrorDetails = process.env.NODE_ENV === 'development',
    } = this.props;

    const { hasError, error, errorInfo, retryCount } = this.state;

    if (hasError) {
      const isMaxRetriesReached = retryCount >= maxRetries;

      return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-xl rounded-lg w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold text-card-foreground">{fallbackTitle}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={this.handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-muted-foreground">{fallbackDescription}</p>

              {/* Error details in development */}
              {showErrorDetails && error && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-destructive mb-2">Detalles técnicos:</h4>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {error.message}
                  </pre>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Retry count info */}
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Intentos: {retryCount}/{maxRetries}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={this.handleClose}
                className="flex-1"
              >
                Cerrar Modal
              </Button>
              
              {allowRetry && !isMaxRetriesReached && (
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              )}

              {isMaxRetriesReached && (
                <Button
                  variant="destructive"
                  onClick={this.handleClose}
                  className="flex-1"
                >
                  Forzar Cierre
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook para facilitar el uso del error boundary en componentes funcionales
 */
export function useModalErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // Lanzar error para ser capturado por el boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    handleError,
    resetError,
  };
}

/**
 * Wrapper HOC para envolver modales con error boundary automáticamente
 */
export function withModalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ModalErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ModalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ModalErrorBoundary>
  );

  WrappedComponent.displayName = `withModalErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Error boundaries especializados para diferentes contextos de modales
 */

// Error boundary para modales de formulario
export const FormModalErrorBoundary: React.FC<{
  children: ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => (
  <ModalErrorBoundary
    fallbackTitle="Error en el Formulario"
    fallbackDescription="Ha ocurrido un error al cargar o procesar el formulario. Los datos que has ingresado pueden no haberse guardado."
    onClose={onClose}
    allowRetry={true}
    maxRetries={2}
  >
    {children}
  </ModalErrorBoundary>
);

// Error boundary para modales de datos/queries
export const DataModalErrorBoundary: React.FC<{
  children: ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => (
  <ModalErrorBoundary
    fallbackTitle="Error al Cargar Datos"
    fallbackDescription="No se pudieron cargar los datos necesarios para este modal. Verifica tu conexión a internet."
    onClose={onClose}
    allowRetry={true}
    maxRetries={3}
  >
    {children}
  </ModalErrorBoundary>
);

export default ModalErrorBoundary;