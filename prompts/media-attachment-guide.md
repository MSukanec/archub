# Guía de Implementación del Sistema de Archivos Media (MEDIA_FILES + MEDIA_LINKS)

## ⚠️ REGLA CRÍTICA - NUNCA ROMPER ESTO

**NUNCA guardes referencias de archivos directamente en las tablas de features (proyectos, clientes, pagos, etc.)**

Desde la migración al sistema de dos tablas (MEDIA_FILES + MEDIA_LINKS), TODOS los archivos adjuntos deben usar este patrón arquitectónico.

## 🏗️ Arquitectura del Sistema

### Dos Tablas Principales:

#### 1. **MEDIA_FILES** (Tabla de Almacenamiento)
- Contiene el archivo físico y sus metadatos
- Un registro por archivo subido
- Campos principales:
  - `id`: UUID del archivo
  - `organization_id`: Organización dueña
  - `created_by`: Miembro que subió el archivo
  - `file_url`: URL pública del archivo
  - `file_path`: Ruta en el bucket de storage
  - `file_name`: Nombre original del archivo
  - `file_type`: Tipo (image, video, pdf, doc, other)
  - `file_size`: Tamaño en bytes
  - `bucket`: Nombre del bucket de Supabase Storage (default: 'media')
  - `is_public`: Visibilidad
  - `is_deleted`: Soft delete

#### 2. **MEDIA_LINKS** (Tabla de Relaciones)
- Vincula archivos con entidades del sistema
- Múltiples links pueden apuntar al mismo archivo
- Campos de relación (nullable, uno debe estar presente):
  - `project_id`: Vinculación con proyectos
  - `site_log_id`: Vinculación con bitácoras
  - `movement_id`: Vinculación con movimientos financieros
  - `contact_id`: Vinculación con contactos
  - `course_lesson_id`: Vinculación con lecciones de cursos
  - `general_cost_id`: Vinculación con costos generales
  - **PRÓXIMO: `client_payment_id`** para pagos de clientes
- Campos adicionales:
  - `visibility`: Nivel de visibilidad
  - `description`: Descripción del archivo
  - `category`: Categoría (dni_front, dni_back, document, photo, etc.)
  - `is_cover`: Indica si es imagen de portada
  - `position`: Orden de visualización
  - `metadata`: JSON con datos adicionales

### Ventajas de esta arquitectura:
✅ Evita duplicación de archivos físicos  
✅ Permite reutilizar archivos entre entidades  
✅ Facilita auditoría y trazabilidad  
✅ Centraliza gestión de storage  
✅ Soft delete sin perder referencias  

## 📝 Cómo Implementar Adjuntos en Nuevas Features

### Paso 1: Verificar que la entidad esté en MEDIA_LINKS

Revisa `prompts/tables/media.md` para ver si tu entidad ya tiene su foreign key en `media_links`.

Si NO existe:
```sql
-- Agregar nueva columna de relación
ALTER TABLE public.media_links 
ADD COLUMN tu_entidad_id uuid NULL;

-- Agregar foreign key constraint
ALTER TABLE public.media_links 
ADD CONSTRAINT media_links_tu_entidad_fkey 
FOREIGN KEY (tu_entidad_id) 
REFERENCES tu_tabla (id) 
ON DELETE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_media_links_tu_entidad 
ON public.media_links 
USING btree (tu_entidad_id) 
WHERE (tu_entidad_id IS NOT NULL AND organization_id IS NOT NULL);
```

### Paso 2: Eliminar columnas antiguas de archivos

Si tu tabla tiene campos como `file_url`, `image_url`, `attachment_url`, etc., debes eliminarlos:

```sql
-- Ejemplo: Eliminar columna file_url de client_payments
ALTER TABLE public.client_payments 
DROP COLUMN IF EXISTS file_url;
```

### Paso 3: Usar el servicio uploadMediaFileV2

En tu feature, importa y usa el servicio de subida:

```typescript
import { uploadMediaFileV2 } from '@/features/media/services/uploadMediaFileV2';

// Ejemplo: Subir comprobante de pago
await uploadMediaFileV2({
  file: archivoFile,                    // File object del input
  organization_id: organizationId,       // UUID de la organización
  created_by: currentMemberId,           // UUID del organization_member.id (NO user.id)
  bucket: 'media',                       // Bucket de Supabase Storage
  
  // RELACIÓN: Al menos una debe estar presente
  client_payment_id: paymentId,          // ID de la entidad relacionada
  project_id: projectId,                 // Opcional si aplica
  
  // METADATOS OPCIONALES
  visibility: 'organization',            // Visibilidad del archivo
  description: 'Comprobante de pago',    // Descripción
  category: 'document',                  // Categoría
  is_cover: false,                       // ¿Es portada?
  position: 0,                           // Orden
  metadata: {                            // JSON libre
    payment_reference: 'REF-001',
    custom_field: 'valor'
  }
});
```

**IMPORTANTE**: El campo `created_by` debe ser `organization_member.id`, NO `user.id`. Usa el patrón:
```typescript
const { data: currentMember } = await supabase
  .from('organization_members')
  .select('id')
  .eq('user_id', userData.user.id)
  .eq('organization_id', organizationId)
  .single();

const createdBy = currentMember.id; // ✅ Correcto
```

### Paso 4: Consultar archivos vinculados

Para obtener archivos de una entidad:

```typescript
// Ejemplo: Obtener archivos de un pago
const { data: files } = await supabase
  .from('media_links')
  .select(`
    id,
    visibility,
    description,
    category,
    is_cover,
    position,
    created_at,
    media_file:media_files (
      id,
      file_url,
      file_name,
      file_type,
      file_size,
      created_at
    )
  `)
  .eq('client_payment_id', paymentId)
  .eq('organization_id', organizationId)
  .order('position', { ascending: true });
```

### Paso 5: Eliminar archivos (Soft Delete)

Para eliminar archivos usa el servicio de eliminación:

```typescript
import { deleteMediaFileV2 } from '@/features/media/services/deleteMediaFileV2';

// Soft delete del archivo
await deleteMediaFileV2(linkId);

// Esto marca:
// - media_links.id = linkId como eliminado
// - Si no hay más links, media_files también se marca como eliminado
```

## 🔍 Ejemplos de Implementación Existente

### Caso: Sitelogs (Bitácoras)
Ver: `src/features/sitelog/services/uploadSiteLogFiles.ts`

```typescript
await uploadMediaFileV2({
  file,
  organization_id: organizationId,
  created_by: createdBy,
  bucket: 'media',
  project_id: projectId,
  site_log_id: siteLogId,      // ← Relación con sitelog
  visibility: 'organization',
  description: description || undefined,
  metadata: { custom_file_name: title }
});
```

### Caso: Contactos (Avatares)
Ver: `src/features/contacts/` (implementación con contact_id)

### Caso: Proyectos (Imágenes de proyecto)
Ver: `src/features/projects/` (implementación con project_id)

### Caso: Cursos (Cover, instructor, módulos, secciones)
Ver: `src/features/courses/` (implementación con course_id y course_module_id)
Categorías:
- `course_cover`: Imagen principal del curso (hero)
- `instructor_photo`: Foto del instructor
- `module_image`: Imagen/GIF del módulo
- `section_background`: Imagen de fondo de sección
- `testimonial_logo`: Logo de cliente/testimonio
- `project_photo`: Foto de proyecto terminado
- `og_image`: Imagen para SEO/redes sociales

## ❌ Errores Comunes a Evitar

### 1. NO guardar URLs directamente en tablas
```typescript
// ❌ MAL - Nunca hagas esto
await supabase
  .from('client_payments')
  .insert({
    amount: 1000,
    file_url: 'https://...'  // ¡NO!
  });

// ✅ BIEN - Usa el sistema de media
await uploadMediaFileV2({
  file: archivo,
  organization_id: orgId,
  created_by: memberId,
  client_payment_id: paymentId
});
```

### 2. NO usar user.id en created_by
```typescript
// ❌ MAL
created_by: userData.user.id

// ✅ BIEN
created_by: organizationMember.id
```

### 3. NO olvidar validar que existe al menos una relación
```typescript
// uploadMediaFileV2 validará que exista al menos uno:
if (!project_id && !site_log_id && !movement_id && ...) {
  throw new Error('Se requiere al menos una entidad relacionada');
}
```

## 📋 Checklist de Migración

Cuando migres una tabla existente:

- [ ] Revisar si la tabla tiene columnas de archivos (file_url, image_url, etc.)
- [ ] Agregar foreign key en media_links si no existe
- [ ] Crear índice para la nueva relación
- [ ] Migrar datos existentes (si hay archivos ya subidos)
- [ ] Eliminar columnas antiguas con ALTER TABLE DROP COLUMN
- [ ] Actualizar servicios para usar uploadMediaFileV2
- [ ] Actualizar queries para JOIN con media_files/media_links
- [ ] Actualizar tipos TypeScript
- [ ] Probar creación, lectura y eliminación de archivos

## 🔗 Archivos de Referencia

- **Esquema de tablas**: `prompts/tables/media.md`
- **Servicio de subida**: `src/features/media/services/uploadMediaFileV2.ts`
- **Servicio de eliminación**: `src/features/media/services/deleteMediaFileV2.ts`
- **Servicio de consulta**: `src/features/media/services/getGalleryFilesV2.ts`
- **Tipos TypeScript**: `src/features/media/types/index.ts`

---

**RECUERDA**: Cada vez que necesites adjuntar archivos a una entidad, consulta esta guía para seguir el patrón correcto. Este sistema es CRÍTICO para la integridad y escalabilidad de la plataforma.
