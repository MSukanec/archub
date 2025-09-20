import { useEffect, useState } from 'react';
import { UseQueryResult } from '@tanstack/react-query';

/**
 * Hook para manejar el patrón de readiness en modales
 * Tracks múltiples queries críticas y proporciona un estado unificado de loading
 */
export interface ModalReadinessConfig {
  /** Queries críticas que deben completarse antes de mostrar el contenido */
  criticalQueries: UseQueryResult<any>[];
  /** Queries opcionales que no bloquean el renderizado pero agregan info útil */
  optionalQueries?: UseQueryResult<any>[];
  /** IDs requeridos (organizationId, projectId, etc.) */
  requiredIds?: Record<string, string | null | undefined>;
  /** Callback cuando todas las queries críticas están listas */
  onReady?: () => void;
  /** Callback cuando alguna query crítica falla */
  onError?: (error: Error) => void;
}

export interface ModalReadinessResult {
  /** True cuando todas las queries críticas han completado exitosamente */
  isReady: boolean;
  /** True cuando alguna query crítica está cargando */
  isLoading: boolean;
  /** True cuando alguna query crítica tiene error */
  hasError: boolean;
  /** Primer error encontrado en queries críticas */
  error: Error | null;
  /** IDs faltantes que impiden el funcionamiento */
  missingIds: string[];
  /** Componente de loading a mostrar cuando no está ready */
  LoadingGate: React.ComponentType<{ children: React.ReactNode }>;
  /** Función para retry de queries con error */
  retryQueries: () => void;
}

/**
 * Hook principal para gestionar readiness de modales
 */
export function useModalReadiness(config: ModalReadinessConfig): ModalReadinessResult {
  const { criticalQueries, optionalQueries = [], requiredIds = {}, onReady, onError } = config;
  const [retryCount, setRetryCount] = useState(0);

  // Verificar IDs requeridos
  const missingIds = Object.entries(requiredIds)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  // Estado de queries críticas
  const criticalLoading = criticalQueries.some(q => q.isLoading);
  const criticalSuccess = criticalQueries.every(q => q.isSuccess);
  const criticalError = criticalQueries.find(q => q.isError);

  // Estado final
  const hasRequiredIds = missingIds.length === 0;
  const isReady = hasRequiredIds && criticalSuccess && !criticalLoading;
  const isLoading = criticalLoading || !hasRequiredIds;
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
    missingIds,
    LoadingGate,
    retryQueries,
  };
}

/**
 * Hook simplificado para casos comunes donde solo se necesita tracking de una query
 */
export function useSimpleModalReadiness(query: UseQueryResult<any>, requiredId?: string | null) {
  return useModalReadiness({
    criticalQueries: [query],
    requiredIds: requiredId ? { id: requiredId } : {},
  });
}

/**
 * Hook para gestionar estados de inputs durante loading
 * Proporciona props consistentes para deshabilitar inputs basado en el estado de readiness
 */
export function useModalInputStates(readiness: ModalReadinessResult, isSubmitting?: boolean) {
  const disabled = !readiness.isReady || isSubmitting || false;
  
  return {
    /** Props para inputs de formulario */
    inputProps: {
      disabled,
    },
    /** Props para botones */
    buttonProps: {
      disabled,
    },
    /** Estado para mostrar spinners */
    showSpinner: readiness.isLoading || isSubmitting || false,
    /** Clase CSS para elementos deshabilitados */
    disabledClassName: disabled ? 'opacity-50 cursor-not-allowed' : '',
  };
}

/**
 * Tipos de hooks que comúnmente necesitan organizationId/projectId en queryKey
 */
export const QUERY_KEY_PATTERNS = {
  /** Queries que dependen de organización */
  ORGANIZATION_SCOPED: [
    'contacts',
    'members',
    'projects',
    'movements', 
    'roles',
    'contact-types',
    'movement-concepts',
  ],
  /** Queries que dependen de proyecto */
  PROJECT_SCOPED: [
    'tasks',
    'phases',
    'budgets',
    'subcontracts',
    'materials',
    'personnel',
  ],
  /** Queries globales que no necesitan scope */
  GLOBAL: [
    'current-user',
    'system-roles',
    'currencies',
  ],
} as const;

/**
 * Helper para construir query keys con scope apropiado
 */
export function buildScopedQueryKey(
  baseKey: string, 
  scopeType: 'organization' | 'project' | 'global',
  scopeId?: string | null,
  ...additionalKeys: (string | number)[]
): (string | number)[] {
  const keys: (string | number)[] = [baseKey];
  
  if (scopeType !== 'global' && scopeId) {
    keys.push(scopeId);
  }
  
  keys.push(...additionalKeys);
  return keys;
}

/**
 * Hook para validar que un modal tenga las dependencias correctas
 */
export function useModalValidation(modalType: string, dependencies: {
  organizationId?: string | null;
  projectId?: string | null;
  userId?: string | null;
}) {
  const warnings: string[] = [];
  
  // Validaciones específicas por tipo de modal
  if (modalType.includes('organization') && !dependencies.organizationId) {
    warnings.push('Organization ID is required for organization-scoped modals');
  }
  
  if (modalType.includes('project') && !dependencies.projectId) {
    warnings.push('Project ID is required for project-scoped modals');
  }
  
  if (modalType.includes('user') && !dependencies.userId) {
    warnings.push('User ID is required for user-scoped modals');
  }
  
  // Log warnings en development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
      console.warn(`Modal validation warnings for ${modalType}:`, warnings);
    }
  }, [modalType, warnings]);
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
}