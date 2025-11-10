/**
 * SISTEMA DE SEGURIDAD DE BASE DE DATOS
 * 
 * Este archivo contiene utilidades para prevenir acciones peligrosas en la base de datos
 * que puedan causar pérdida de datos o modificaciones no deseadas.
 */

export interface SafetyCheckResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Verifica que los datos del usuario sean válidos antes de cualquier operación de base de datos
 */
export function validateUserDataForDatabaseOperation(userData: any): SafetyCheckResult {
  
  // Check 1: User exists
  if (!userData) {
    const error = 'SAFETY VIOLATION: No user data provided for database operation';
    return { isValid: false, error };
  }

  // Check 2: User has valid ID
  if (!userData.user?.id) {
    const error = 'SAFETY VIOLATION: No user ID available for database operation';
    return { isValid: false, error, details: { hasUser: !!userData.user } };
  }

  // Check 3: Preferences exist (for preference-related operations)
  if (!userData.preferences) {
    const error = 'SAFETY WARNING: User preferences are null - may need recovery';
    return { 
      isValid: false, 
      error, 
      details: { 
        userId: userData.user.id,
        hasPreferences: false,
        preferencesId: null
      }
    };
  }

  // Check 4: Preferences have valid ID
  if (!userData.preferences.id) {
    const error = 'SAFETY VIOLATION: User preferences exist but have no ID';
    return { 
      isValid: false, 
      error, 
      details: { 
        userId: userData.user.id,
        hasPreferences: true,
        preferencesId: userData.preferences.id
      }
    };
  }

  return { 
    isValid: true, 
    details: { 
      userId: userData.user.id,
      preferencesId: userData.preferences.id,
      organizationId: userData.organization.id
    }
  };
}

/**
 * Wrapper seguro para operaciones de actualización en user_preferences
 */
export function createSafePreferencesUpdate() {
  return {
    /**
     * Genera una cláusula WHERE segura para actualizar preferences
     */
    generateSafeWhereClause: (userData: any) => {
      const safetyCheck = validateUserDataForDatabaseOperation(userData);
      
      if (!safetyCheck.isValid) {
        throw new Error(`Database operation blocked: ${safetyCheck.error}`);
      }

      return {
        preferencesId: userData.preferences.id,
        userId: userData.user.id,
        // Retorna un objeto que debe usarse con .eq('id', preferencesId).eq('user_id', userId)
        whereClause: `id = '${userData.preferences.id}' AND user_id = '${userData.user.id}'`
      };
    }
  };
}

/**
 * Log de operaciones peligrosas para auditoría
 */
export function logDatabaseOperation(operation: string, table: string, userId?: string, additionalData?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    table,
    userId: userId || 'UNKNOWN',
    additionalData: additionalData || {}
  };
  
  
  // En producción, esto debería enviarse a un sistema de logging externo
  if (typeof window !== 'undefined') {
    const existingLogs = JSON.parse(localStorage.getItem('database_operations_log') || '[]');
    existingLogs.push(logEntry);
    // Mantener solo los últimos 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    localStorage.setItem('database_operations_log', JSON.stringify(existingLogs));
  }
}

/**
 * Constantes de seguridad
 */
export const DATABASE_SAFETY = {
  CRITICAL_TABLES: ['user_preferences', 'users', 'user_data', 'organizations'],
  FORBIDDEN_OPERATIONS_WITHOUT_WHERE: ['DELETE', 'UPDATE'],
  REQUIRED_WHERE_CLAUSES: {
    'user_preferences': ['id', 'user_id'],
    'user_data': ['user_id'],
    'organization_members': ['user_id', 'organization_id']
  }
} as const;