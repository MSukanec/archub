import React, { useEffect, useState } from 'react';
import { UseQueryResult } from '@tanstack/react-query';

// Tipos de utilidades para readiness
export interface ReadinessQuery {
  queryKey: string;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch?: () => void;
  error?: Error | null;
}

export interface UseModalReadinessConfig {
  criticalQueries: ReadinessQuery[];
  optionalQueries?: ReadinessQuery[];
  requiredIds?: Record<string, any>;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface ModalReadinessState {
  isReady: boolean;
  isLoading: boolean;
  hasError: boolean;
  error: Error | null;
  retryQueries: () => void;
  LoadingGate: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Hook principal para manejar el readiness de modales
 */
export function useModalReadiness({
  criticalQueries,
  optionalQueries = [],
  requiredIds = {},
  onReady,
  onError,
}: UseModalReadinessConfig): ModalReadinessState {
  const [retryCount, setRetryCount] = useState(0);

  // Verificar IDs requeridos
  const missingIds = Object.entries(requiredIds)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  // Estado de queries críticas
  const criticalLoading = criticalQueries.some(q => q.isLoading);
  const criticalError = criticalQueries.find(q => q.isError);
  const criticalReady = criticalQueries.every(q => q.isSuccess);

  // Estado combinado
  const isReady = criticalReady && missingIds.length === 0;
  const isLoading = criticalLoading || (!isReady && !criticalError);
  const hasError = !!criticalError || missingIds.length > 0;

  const error = criticalError?.error instanceof Error 
    ? criticalError.error 
    : missingIds.length > 0 
      ? new Error(`Missing required IDs: ${missingIds.join(', ')}`)
      : null;

  // Callbacks
  useEffect(() => {
    if (isReady && onReady) {
      onReady();
    }
  }, [isReady, onReady]);

  useEffect(() => {
    if (hasError && error && onError) {
      onError(error);
    }
  }, [hasError, error, onError]);

  // Función de retry
  const retryQueries = () => {
    criticalQueries.forEach(q => {
      if (q.isError && q.refetch) {
        q.refetch();
      }
    });
    setRetryCount(prev => prev + 1);
  };

  // Componente LoadingGate
  const LoadingGate: React.ComponentType<{ children: React.ReactNode }> = ({ children }) => {
    if (isReady) {
      return <>{children}</>;
    }

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-destructive">Error al cargar</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message || 'Ocurrió un error inesperado'}
            </p>
          </div>
          <button
            onClick={retryQueries}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-center">
          <h3 className="text-lg font-medium">Cargando...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Preparando la información necesaria
          </p>
        </div>
      </div>
    );
  };

  return {
    isReady,
    isLoading,
    hasError,
    error,
    retryQueries,
    LoadingGate,
  };
}

/**
 * Hook simplificado para casos simples
 */
export function useSimpleModalReadiness(
  queries: UseQueryResult<any>[]
): {
  isReady: boolean;
  isLoading: boolean;
  LoadingGate: React.ComponentType<{ children: React.ReactNode }>;
} {
  const readinessQueries: ReadinessQuery[] = queries.map((query, index) => ({
    queryKey: `query-${index}`,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    error: query.error as Error,
  }));

  const { isReady, isLoading, LoadingGate } = useModalReadiness({
    criticalQueries: readinessQueries,
  });

  return { isReady, isLoading, LoadingGate };
}

/**
 * Utilidad para crear ReadinessQuery desde UseQueryResult
 */
export function createReadinessQuery(
  queryKey: string,
  query: UseQueryResult<any>
): ReadinessQuery {
  return {
    queryKey,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    error: query.error as Error,
  };
}