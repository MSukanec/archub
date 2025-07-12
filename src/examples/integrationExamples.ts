/**
 * EJEMPLOS DE INTEGRACIÓN DEL SISTEMA DE LOGGING
 * 
 * Este archivo contiene ejemplos de cómo integrar el sistema de logging
 * en diferentes partes de la aplicación. Estos ejemplos pueden ser
 * copiados y adaptados según sea necesario.
 */

import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

// =========================================================================
// EJEMPLO 1: INTEGRACIÓN EN CREACIÓN DE MOVIMIENTOS FINANCIEROS
// =========================================================================

/**
 * Ejemplo de mutation para crear movimientos con logging integrado
 */
export const createMovementWithLogging = async (movementData: any, userData: any) => {
  // 1. Crear el movimiento en la base de datos
  const { data: newMovement, error } = await supabase
    .from('movements')
    .insert([movementData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.CREATE_MOVEMENT,
      target_table: TARGET_TABLES.MOVEMENTS,
      target_id: newMovement.id,
      metadata: {
        amount: newMovement.amount,
        description: newMovement.description,
        currency_id: newMovement.currency_id,
        wallet_id: newMovement.wallet_id,
        category_id: newMovement.category_id,
        movement_date: newMovement.movement_date
      }
    });
  } catch (logError) {
    console.error('Error logging movement creation:', logError);
    // No lanzamos el error para no interrumpir el flujo principal
  }

  return newMovement;
};

// =========================================================================
// EJEMPLO 2: INTEGRACIÓN EN ACTUALIZACIÓN DE MOVIMIENTOS
// =========================================================================

/**
 * Ejemplo de mutation para actualizar movimientos con logging
 */
export const updateMovementWithLogging = async (movementId: string, updateData: any, userData: any) => {
  // 1. Actualizar el movimiento
  const { data: updatedMovement, error } = await supabase
    .from('movements')
    .update(updateData)
    .eq('id', movementId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.UPDATE_MOVEMENT,
      target_table: TARGET_TABLES.MOVEMENTS,
      target_id: movementId,
      metadata: {
        updated_fields: Object.keys(updateData),
        new_amount: updatedMovement.amount,
        new_description: updatedMovement.description
      }
    });
  } catch (logError) {
    console.error('Error logging movement update:', logError);
  }

  return updatedMovement;
};

// =========================================================================
// EJEMPLO 3: INTEGRACIÓN EN CREACIÓN DE CONTACTOS
// =========================================================================

/**
 * Ejemplo de mutation para crear contactos con logging
 */
export const createContactWithLogging = async (contactData: any, userData: any) => {
  // 1. Crear el contacto
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert([contactData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.ADD_CONTACT,
      target_table: TARGET_TABLES.CONTACTS,
      target_id: newContact.id,
      metadata: {
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        email: newContact.email,
        contact_type_id: newContact.contact_type_id
      }
    });
  } catch (logError) {
    console.error('Error logging contact creation:', logError);
  }

  return newContact;
};

// =========================================================================
// EJEMPLO 4: INTEGRACIÓN EN CREACIÓN DE TAREAS KANBAN
// =========================================================================

/**
 * Ejemplo de mutation para crear tareas Kanban con logging
 */
export const createTaskWithLogging = async (taskData: any, userData: any) => {
  // 1. Crear la tarea
  const { data: newTask, error } = await supabase
    .from('kanban_cards')
    .insert([taskData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.CREATE_TASK,
      target_table: TARGET_TABLES.KANBAN_CARDS,
      target_id: newTask.id,
      metadata: {
        title: newTask.title,
        description: newTask.description,
        list_id: newTask.list_id,
        assigned_to: newTask.assigned_to,
        due_date: newTask.due_date
      }
    });
  } catch (logError) {
    console.error('Error logging task creation:', logError);
  }

  return newTask;
};

// =========================================================================
// EJEMPLO 5: INTEGRACIÓN EN SUBIDA DE DOCUMENTOS DE DISEÑO
// =========================================================================

/**
 * Ejemplo de function para subir documentos de diseño con logging
 */
export const uploadDesignDocumentWithLogging = async (documentData: any, userData: any) => {
  // 1. Subir el documento
  const { data: newDocument, error } = await supabase
    .from('design_documents')
    .insert([documentData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.UPLOAD_DESIGN_DOCUMENT,
      target_table: TARGET_TABLES.DESIGN_DOCUMENTS,
      target_id: newDocument.id,
      metadata: {
        file_name: newDocument.file_name,
        folder: newDocument.folder,
        status: newDocument.status,
        design_phase_id: newDocument.design_phase_id,
        version: newDocument.version
      }
    });
  } catch (logError) {
    console.error('Error logging document upload:', logError);
  }

  return newDocument;
};

// =========================================================================
// EJEMPLO 6: INTEGRACIÓN EN GESTIÓN DE MIEMBROS
// =========================================================================

/**
 * Ejemplo de mutation para agregar miembros con logging
 */
export const addMemberWithLogging = async (memberData: any, userData: any) => {
  // 1. Agregar el miembro
  const { data: newMember, error } = await supabase
    .from('organization_members')
    .insert([memberData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.ADD_MEMBER,
      target_table: TARGET_TABLES.ORGANIZATION_MEMBERS,
      target_id: newMember.id,
      metadata: {
        invited_user_id: newMember.user_id,
        role_id: newMember.role_id,
        invitation_method: 'email'
      }
    });
  } catch (logError) {
    console.error('Error logging member addition:', logError);
  }

  return newMember;
};

// =========================================================================
// EJEMPLO 7: INTEGRACIÓN EN GESTIÓN DE CLIENTES DE PROYECTO
// =========================================================================

/**
 * Ejemplo de mutation para agregar clientes a proyecto con logging
 */
export const addProjectClientWithLogging = async (clientData: any, userData: any) => {
  // 1. Agregar el cliente al proyecto
  const { data: newProjectClient, error } = await supabase
    .from('project_clients')
    .insert([clientData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 2. Registrar la actividad
  try {
    await logActivity({
      organization_id: userData.preferences.last_organization_id,
      user_id: userData.user.id,
      action: ACTIVITY_ACTIONS.ADD_CLIENT,
      target_table: TARGET_TABLES.PROJECT_CLIENTS,
      target_id: newProjectClient.id,
      metadata: {
        project_id: newProjectClient.project_id,
        contact_id: newProjectClient.contact_id,
        committed_amount: newProjectClient.committed_amount,
        currency_id: newProjectClient.currency_id
      }
    });
  } catch (logError) {
    console.error('Error logging client addition:', logError);
  }

  return newProjectClient;
};

// =========================================================================
// EJEMPLO DE USO EN UN HOOK PERSONALIZADO
// =========================================================================

/**
 * Ejemplo de hook personalizado que integra logging
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';

export function useCreateMovementWithLogging() {
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (movementData: any) => {
      return await createMovementWithLogging(movementData, userData);
    },
    onSuccess: (newMovement) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      
      // Mostrar notificación
      toast({
        title: 'Movimiento creado',
        description: 'El movimiento financiero ha sido registrado correctamente'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el movimiento',
        variant: 'destructive'
      });
    }
  });
}