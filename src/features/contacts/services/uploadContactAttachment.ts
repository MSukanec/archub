import { supabase } from '@/lib/supabase';
import { uploadToBucket, removeFromBucket } from '@/lib/supabase/storage';
import type { ContactAttachment, ContactAttachmentInput } from '../types';
import { CONTACT_STORAGE_BUCKET } from '../constants';
import { slugifyFileName } from '../utils';

/**
 * Sube un archivo adjunto a un contacto.
 * 
 * Proceso:
 * 1. Obtiene el organization_id del contacto
 * 2. Genera un storage_path único
 * 3. Sube el archivo al bucket
 * 4. Crea el registro en la base de datos
 * 5. Si falla, limpia el archivo subido
 * 
 * @param contactId - ID del contacto
 * @param input - Datos del adjunto (archivo, categoría, metadata)
 * @param createdBy - ID del usuario que sube el archivo
 * @returns Adjunto creado
 * @throws {Error} Si falla la subida o creación
 */
export async function uploadContactAttachment(
  contactId: string,
  input: ContactAttachmentInput,
  createdBy: string
): Promise<ContactAttachment> {
  if (!supabase || !contactId) {
    throw new Error('Missing required parameters');
  }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error(`Error al obtener contacto: ${contactError?.message || 'Contacto no encontrado'}`);
  }

  const uuid = crypto.randomUUID();
  const sluggedName = slugifyFileName(input.file.name);
  const storage_path = `${contactId}/${uuid}_${sluggedName}`;

  try {
    await uploadToBucket(CONTACT_STORAGE_BUCKET, storage_path, input.file);

    const { data, error } = await supabase
      .from('contact_attachments')
      .insert({
        contact_id: contactId,
        organization_id: contact.organization_id,
        storage_bucket: CONTACT_STORAGE_BUCKET,
        storage_path,
        file_name: input.file.name,
        mime_type: input.file.type,
        size_bytes: input.file.size,
        category: input.category,
        metadata: input.metadata || {},
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      await removeFromBucket(CONTACT_STORAGE_BUCKET, [storage_path]);
      throw new Error(`Error al crear adjunto: ${error.message}`);
    }

    return data;
  } catch (error) {
    try {
      await removeFromBucket(CONTACT_STORAGE_BUCKET, [storage_path]);
    } catch (cleanupError) {
      console.error('Error al limpiar archivo tras fallo:', cleanupError);
    }
    throw error;
  }
}
