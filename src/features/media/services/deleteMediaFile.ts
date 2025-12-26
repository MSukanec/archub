import { supabase } from '@/lib/supabase';
/**
 * Elimina un archivo de media (de storage y base de datos).
 * 
 * Realiza las siguientes operaciones:
 * 1. Obtiene la ruta del archivo en storage
 * 2. Elimina el archivo del bucket de storage
 * 3. Elimina el registro de la base de datos
 * 
 * @param fileId - ID del archivo a eliminar
 * @returns void
 * @throws {Error} Si falla alguna operación de Supabase
 */
export async function deleteMediaFile(fileId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  // Get file data first
  const { data: fileData, error: fetchError } = await supabase
    .from('project_media')
    .select('file_path')
    .eq('id', fileId)
    .single();
  if (fetchError) throw fetchError;
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove([fileData.file_path]);
  if (storageError) throw storageError;
  // Delete from database
  const { error: dbError } = await supabase
    .from('project_media')
    .delete()
    .eq('id', fileId);
  if (dbError) throw dbError;
}
