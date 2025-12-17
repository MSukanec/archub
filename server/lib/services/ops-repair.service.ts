/**
 * Ops Repair Service
 * 
 * Servicio que actúa como wrapper del dispatcher SQL en Supabase.
 * 
 * ARQUITECTURA:
 * - La lógica de reparación está 100% en Supabase (funciones SQL)
 * - Este servicio SOLO llama al dispatcher: ops_execute_repair_action()
 * - Supabase maneja: validación, ejecución, auditoría, resolución
 * 
 * NO DUPLICAR lógica de reparación aquí.
 * Supabase es la fuente de verdad.
 */

import { supabaseAdmin } from "../supabase/admin.js";

// ============================================================================
// TYPES
// ============================================================================

export interface RepairActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  error?: string;
}

interface OpsRepairAction {
  id: string;
  alert_type: string;
  action_id: string;
  label: string;
  description: string | null;
  is_dangerous: boolean;
  is_active: boolean;
  required_evidence: string[] | null;
  execution_order: number;
}

interface SqlDispatcherResult {
  success: boolean;
  message: string;
  data: Record<string, any> | null;
  error: string | null;
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Ejecuta una acción de reparación llamando al dispatcher SQL de Supabase.
 * 
 * El dispatcher SQL (ops_execute_repair_action) se encarga de:
 * 1. Validar que la alerta existe y está en estado válido
 * 2. Validar que la acción existe y está activa
 * 3. Ejecutar la función de reparación correspondiente
 * 4. Registrar en ops_repair_logs
 * 5. Marcar la alerta como resolved si es exitoso
 */
export async function executeOpsRepairAction(
  alertId: string,
  actionId: string,
  executedBy: string
): Promise<RepairActionResult> {
  try {
    // Llamar al dispatcher SQL central
    const { data, error } = await supabaseAdmin.rpc("ops_execute_repair_action", {
      p_alert_id: alertId,
      p_action_id: actionId,
      p_executed_by: executedBy,
    });

    if (error) {
      console.error("[OpsRepairService] SQL dispatcher error:", error);
      return {
        success: false,
        message: `Error ejecutando reparación: ${error.message}`,
        error: error.message,
      };
    }

    // El dispatcher retorna un objeto JSON con { success, message, data, error }
    const result = data as SqlDispatcherResult;

    if (!result) {
      return {
        success: false,
        message: "El dispatcher SQL no retornó resultado",
        error: "Empty result from SQL dispatcher",
      };
    }

    return {
      success: result.success,
      message: result.message,
      data: result.data || undefined,
      error: result.error || undefined,
    };

  } catch (error: any) {
    console.error("[OpsRepairService] Unexpected error:", error);
    return {
      success: false,
      message: "Error inesperado al ejecutar la acción",
      error: error.message,
    };
  }
}

// ============================================================================
// HELPER: Get available actions for an alert type
// ============================================================================

/**
 * Obtiene las acciones de reparación disponibles para un tipo de alerta.
 * Lee directamente de ops_repair_actions en Supabase.
 */
export async function getAvailableRepairActions(alertType: string): Promise<OpsRepairAction[]> {
  const { data: dbActions, error } = await supabaseAdmin
    .from("ops_repair_actions")
    .select("*")
    .eq("alert_type", alertType)
    .eq("is_active", true)
    .order("execution_order", { ascending: true });

  if (error) {
    console.warn("[OpsRepairService] Error fetching actions from DB:", error.message);
    return [];
  }

  return dbActions || [];
}
