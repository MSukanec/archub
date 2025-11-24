# Guía de Migración: Project Images → 3-Bucket Architecture

## Contexto

Las imágenes de proyectos legacy están en el bucket `project-image` con URLs almacenadas en `project_data.project_image_url`. La nueva arquitectura usa:
- **Bucket nuevo:** `social-assets`
- **Path structure:** `projects/{org_id}/{project_id}/gallery/{filename}`
- **Metadata:** `image_bucket` + `image_path` (en lugar de URL directa)

## Pasos de Migración

### 1. Verificar Estado Actual

Primero, verifica cuántos proyectos necesitan migración ejecutando un dry-run:

```bash
tsx scripts/migrate-project-images.ts --dry-run
```

Esto mostrará:
- Cuántos proyectos tienen imágenes en legacy bucket
- Qué archivos se migrarían
- Nuevas rutas que se crearían
- **NO hace cambios reales**

### 2. Ejecutar Migración (SIN eliminar archivos antiguos)

Una vez verificado, ejecuta la migración real:

```bash
tsx scripts/migrate-project-images.ts
```

Esto hará:
1. ✅ Descargar imagen del bucket legacy
2. ✅ Re-subir a bucket nuevo con path correcto
3. ✅ Actualizar metadata en `project_data` (image_bucket + image_path)
4. ⏭️  **NO** eliminar archivos del bucket legacy (seguridad)

### 3. Verificar Resultados

Después de la migración:

1. **Revisa las imágenes en la app:**
   - Ve a la página de proyectos
   - Verifica que todos los covers de proyectos se muestran correctamente
   - Chequea diferentes vistas (cards, rows, dashboard)

2. **Verifica el bucket nuevo:**
   - Abre Supabase Storage
   - Busca bucket `social-assets`
   - Verifica que existe carpeta `projects/`
   - Chequea que las imágenes están en: `projects/{org_id}/{project_id}/gallery/`

3. **Verifica metadata en DB:**
   ```sql
   SELECT 
     id,
     name,
     image_bucket,
     image_path
   FROM project_data
   WHERE image_bucket IS NOT NULL
   LIMIT 10;
   ```

### 4. Eliminar Archivos Legacy (OPCIONAL)

**⚠️ SOLO después de verificar que TODO funciona correctamente:**

```bash
tsx scripts/migrate-project-images.ts --delete-old
```

Esto eliminará las imágenes del bucket `project-image` legacy. Úsalo SOLO si:
- ✅ Todas las imágenes se muestran correctamente en la app
- ✅ Has verificado el bucket nuevo
- ✅ Has confirmado metadata en DB
- ✅ Tienes backup de tu base de datos

## Flags Disponibles

| Flag | Descripción |
|------|-------------|
| `--dry-run` | Muestra qué se migraría sin hacer cambios |
| `--delete-old` | Elimina imágenes del bucket legacy después de migrar |
| `--skip-missing-org` | Omite proyectos sin `organization_id` en lugar de fallar |

## Combinaciones Comunes

### Dry run completo
```bash
tsx scripts/migrate-project-images.ts --dry-run
```

### Migración safe (sin eliminar old)
```bash
tsx scripts/migrate-project-images.ts
```

### Migración completa (con delete)
```bash
tsx scripts/migrate-project-images.ts --delete-old
```

### Omitir proyectos sin org
```bash
tsx scripts/migrate-project-images.ts --skip-missing-org
```

## Casos Edge

### Proyectos sin organization_id

Si encuentras este error:
```
❌ Project has no organization_id
```

Opciones:
1. **Arreglar manualmente en DB** (recomendado):
   ```sql
   UPDATE projects 
   SET organization_id = 'your-org-id'
   WHERE id = 'project-id-with-error';
   ```

2. **Omitir con flag**:
   ```bash
   tsx scripts/migrate-project-images.ts --skip-missing-org
   ```

### Errores de Download

Si un archivo no se puede descargar del bucket legacy:
- Verifica que el archivo existe en Supabase Storage
- Chequea permisos del bucket `project-image`
- Revisa la URL en `project_image_url`

El script registrará el error y continuará con los siguientes proyectos.

### Update Database Fail

Si falla al actualizar la base de datos:
- Verifica que `project_data` tiene las columnas `image_bucket` y `image_path`
- Ejecuta la migración SQL: `migrations/add_project_image_metadata.sql`
- Reintentar

## Output del Script

El script muestra:

```
╔════════════════════════════════════════════════════════════╗
║   PROJECT IMAGE MIGRATION: Legacy → 3-Bucket Architecture  ║
╚════════════════════════════════════════════════════════════╝

Searching for projects to migrate...

Found 15 project(s) to migrate:
  1. Casa Rodriguez (abc-123)
  2. Edificio Numa (xyz-789)
  ...

[abc-123] Migrating: Casa Rodriguez
  Old URL: https://...project-image/abc123/hero.jpg
  Legacy path: project-image/abc123/hero.jpg
  New path: social-assets/projects/org-id/abc-123/gallery/hero.jpg
  Downloading from legacy bucket...
  Downloaded 245123 bytes
  Uploading to new bucket...
  Updating database metadata...
  ✅ Migration successful

╔════════════════════════════════════════════════════════════╗
║                    MIGRATION SUMMARY                       ║
╚════════════════════════════════════════════════════════════╝

Total projects:     15
✅ Successful:      14
❌ Failed:          1
⏭️  Skipped:         0

❌ Errors encountered:
  1. Project xyz-789: Failed to download: File not found

🎉 Migration complete!
```

## Rollback

Si algo sale mal y necesitas volver atrás:

1. **Las imágenes legacy todavía existen** (a menos que usaste `--delete-old`)
2. **Restaurar metadata:**
   ```sql
   UPDATE project_data
   SET image_bucket = NULL,
       image_path = NULL
   WHERE image_bucket = 'social-assets';
   ```

3. **Eliminar archivos migrados del bucket nuevo:**
   - Manualmente desde Supabase Storage UI
   - O dejar ahí (no hacen daño, solo ocupan espacio)

## Próximos Pasos

Después de migrar exitosamente:

1. ✅ Actualiza `replit.md` si hay cambios relevantes
2. ✅ Opcional: Elimina archivos legacy con `--delete-old`
3. ✅ Opcional: Elimina bucket `project-image` legacy de Supabase
4. ✅ Considera ejecutar migrations similares para otros entity types si aplica

## Soporte

Si encuentras problemas:
1. Revisa los logs del script
2. Chequea la sección "Errores comunes" arriba
3. Verifica permisos de buckets en Supabase
4. Consulta `prompts/Upload.md` para arquitectura detallada
