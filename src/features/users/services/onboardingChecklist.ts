import { supabase } from '@/lib/supabase';
/**
 * Actualiza el checklist de inicio del usuario.
 * 
 * Este servicio marca tareas completadas en el onboarding/checklist inicial
 * del usuario (como crear primer proyecto, primer contacto, etc).
 * 
 * @param key - Clave del checklist a actualizar (ej: 'create_project', 'create_contact')
 * @param value - Valor booleano indicando si la tarea está completada
 * @throws {Error} Si falla la actualización del checklist
 */
export async function updateHomeChecklist(key: string, value: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  const { error } = await supabase.rpc('tick_home_checklist', {
    p_key: key,
    p_value: value
  });
  if (error) {
    console.error('Error updating home checklist:', error);
    throw error;
  }
}
