# Tarea: Implementar Signed URLs para Contenido Privado de Organizaciones

## Contexto

Actualmente el sistema de media usa `getPublicUrl()` para TODOS los archivos, incluyendo los que tienen `visibility = 'organization'` o `visibility = 'private'`. Esto significa que aunque `is_public = false`, las URLs son públicas y accesibles sin autenticación.

## Problema de Seguridad

- Archivos privados de organizaciones (sitelogs, documentos, fotos) tienen URLs públicas
- Cualquiera con la URL puede acceder al contenido sin autenticación
- Viola el contrato de access-control del sistema
- Potencial exposición de datos sensibles

## Solución Propuesta

Implementar signed URLs para contenido no público:

### 1. Modificar uploadMediaFileV2

```typescript
// En vez de siempre usar getPublicUrl:
const publicUrl = visibility === 'public' 
  ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
  : null; // No generar URL pública para contenido privado
```

### 2. Crear servicio para generar signed URLs

```typescript
export async function getSignedMediaUrl(
  fileId: string, 
  expiresIn: number = 3600
): Promise<string> {
  // 1. Fetch file path from media_files
  // 2. Check visibility/permissions
  // 3. Generate signed URL with expiration
  // 4. Return time-limited URL
}
```

### 3. Actualizar consumers

Todos los lugares que usan `file_url` directamente deben:
- Para `visibility = 'public'`: Usar file_url directamente (como ahora)
- Para `visibility != 'public'`: Llamar a `getSignedMediaUrl(fileId)` on-demand

## Lugares a Actualizar

- `getGalleryFilesV2` - Galería de proyectos
- `getSitelogGalleryFiles` - Sitelogs
- `uploadSiteLogFiles` - Subida de sitelog
- `ClientPaymentsModal` - Pagos de clientes
- Cualquier otro lugar que muestre archivos privados

## Consideraciones

### Performance
- Signed URLs expiran, requieren regeneración
- Cache de signed URLs con TTL
- Generar on-demand vs pre-generar

### Storage Buckets
- Considerar buckets separados para público vs privado
- Bucket público: sin autenticación
- Bucket privado: requiere signed URLs

### Backward Compatibility
- Los archivos existentes ya tienen public URLs en `file_url`
- Necesita migración gradual o flag de feature

## Prioridad

**ALTA** - Esto es un problema de seguridad real que puede exponer datos sensibles de organizaciones.

## Estimación

- Diseño: 1-2 horas
- Implementación: 4-6 horas  
- Testing: 2-3 horas
- **Total: ~1 día de desarrollo**

## Recursos

- [Supabase Storage Signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

## Notas

- Esta tarea surgió durante la migración de cursos a media_links
- Cursos usan `visibility = 'public'` correctamente y NO están afectados
- El problema aplica solo a contenido privado de organizaciones
