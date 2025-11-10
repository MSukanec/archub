import { supabase } from '@/lib/supabase';

interface LogActivityParams {
  organization_id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  metadata?: object;
}

/**
 * Registra actividad en la organización usando la función Supabase log_organization_activity
 * 
 * @param params Parámetros de la actividad a registrar
 * @returns Promise con el resultado de la operación
 * 
 * @example
 * ```ts
 * await logActivity({
 *   organization_id: '123e4567-e89b-12d3-a456-426614174000',
 *   user_id: '123e4567-e89b-12d3-a456-426614174001',
 *   action: 'create_movement',
 *   target_table: 'movements',
 *   target_id: newMovement.id,
 *   metadata: { amount: 1500.00, description: 'Pago de materiales' }
 * });
 * ```
 */
export async function logActivity({
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata = {}
}: LogActivityParams): Promise<void> {
  try {
    // Insertar directamente en organization_activity_logs para evitar problemas con la función de Supabase
    const { data, error } = await supabase
      .from('organization_activity_logs')
      .insert({
        organization_id,
        user_id,
        action,
        target_table,
        target_id,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging activity:', error);
      // No lanzamos el error para evitar que interrumpa el flujo principal
      return;
    }

    console.log(`Activity logged: ${action} on ${target_table}`, { target_id, metadata });
  } catch (error) {
    console.error('Error in logActivity:', error);
    // No lanzamos el error para evitar que interrumpa el flujo principal
    // pero lo registramos para debugging
  }
}

// Tipos de acciones predefinidas para mayor consistencia
export const ACTIVITY_ACTIONS = {
  // Movimientos financieros
  CREATE_MOVEMENT: 'create_movement',
  UPDATE_MOVEMENT: 'update_movement',
  DELETE_MOVEMENT: 'delete_movement',
  
  // Bitácora de obra
  CREATE_SITE_LOG: 'create_site_log',
  UPDATE_SITE_LOG: 'update_site_log',
  DELETE_SITE_LOG: 'delete_site_log',
  
  // Documentos de diseño
  UPLOAD_DESIGN_DOCUMENT: 'upload_design_document',
  UPDATE_DESIGN_DOCUMENT: 'update_design_document',
  DELETE_DESIGN_DOCUMENT: 'delete_design_document',
  
  // Cómputos
  CREATE_TASK: 'create_task',
  UPDATE_TASK: 'update_task',
  DELETE_TASK: 'delete_task',
  COMPLETE_TASK: 'complete_task',
  
  // Contactos
  ADD_CONTACT: 'add_contact',
  UPDATE_CONTACT: 'update_contact',
  DELETE_CONTACT: 'delete_contact',
  
  // Miembros
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member',
  UPDATE_MEMBER: 'update_member',
  
  // Clientes
  ADD_CLIENT: 'add_client',
  UPDATE_CLIENT: 'update_client',
  REMOVE_CLIENT: 'remove_client'
} as const;

// Tabla de mapeo para target_table
export const TARGET_TABLES = {
  MOVEMENTS: 'movements',
  SITE_LOGS: 'site_logs',
  DESIGN_DOCUMENTS: 'documents',
  TASKS: 'tasks',
  KANBAN_CARDS: 'kanban_cards',
  CONTACTS: 'contacts',
  ORGANIZATION_MEMBERS: 'organization_members',
  PROJECT_CLIENTS: 'project_clients'
} as const;