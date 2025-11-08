import { supabase } from '@/lib/supabase';
import { uploadToBucket, removeFromBucket, getPublicUrl } from '@/lib/supabase/storage';

export interface ContactAttachment {
  id: string;
  contact_id: string;
  organization_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  metadata?: any;
  created_by: string;
  created_at: string;
}

// Función helper para slugify
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listContactAttachments(contactId: string): Promise<ContactAttachment[]> {
  const { data, error } = await supabase
    .from('contact_attachments')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener adjuntos: ${error.message}`);
  }

  return data || [];
}

export async function createContactAttachment(params: {
  contactId: string;
  file: File;
  category: 'dni_front' | 'dni_back' | 'document' | 'photo' | 'other';
  metadata?: any;
  createdBy: string;
}): Promise<ContactAttachment> {
  const { contactId, file, category, metadata, createdBy } = params;

  // Primero obtener el organization_id del contacto
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error(`Error al obtener información del contacto: ${contactError?.message || 'Contacto no encontrado'}`);
  }

  // Generar storage_path
  const uuid = crypto.randomUUID();
  const sluggedName = slugify(file.name);
  const storage_path = `${contactId}/${uuid}_${sluggedName}`;

  try {
    // Subir a bucket contact-files
    await uploadToBucket('contact-files', storage_path, file);

    // Insertar fila en contact_attachments
    const { data, error } = await supabase
      .from('contact_attachments')
      .insert({
        contact_id: contactId,
        organization_id: contact.organization_id,
        storage_bucket: 'contact-files',
        storage_path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        category,
        metadata,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      // Si falla la inserción, limpiar el archivo subido
      await removeFromBucket('contact-files', [storage_path]);
      throw new Error(`Error al crear registro de adjunto: ${error.message}`);
    }

    return data;
  } catch (error) {
    // Asegurar limpieza en caso de error
    try {
      await removeFromBucket('contact-files', [storage_path]);
    } catch (cleanupError) {
      console.error('Error al limpiar archivo tras fallo:', cleanupError);
    }
    throw error;
  }
}

export async function deleteContactAttachment(attachmentId: string): Promise<void> {
  // Obtener información del attachment
  const { data: attachment, error: fetchError } = await supabase
    .from('contact_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single();

  if (fetchError) {
    throw new Error(`Error al obtener adjunto: ${fetchError.message}`);
  }

  if (!attachment) {
    throw new Error('Adjunto no encontrado');
  }

  try {
    // Borrar en Storage
    await removeFromBucket(attachment.storage_bucket, [attachment.storage_path]);

    // Borrar registro en base de datos
    const { error: deleteError } = await supabase
      .from('contact_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      throw new Error(`Error al eliminar registro: ${deleteError.message}`);
    }
  } catch (error) {
    throw error;
  }
}

export async function setContactAvatarFromAttachment(contactId: string, attachmentId: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update({
      avatar_attachment_id: attachmentId,
      avatar_updated_at: new Date().toISOString()
    })
    .eq('id', contactId);

  if (error) {
    throw new Error(`Error al actualizar avatar: ${error.message}`);
  }
}

export function getAttachmentPublicUrl(attachment: ContactAttachment): string {
  return getPublicUrl(attachment.storage_bucket, attachment.storage_path);
}