# Scripts de Migración

Este directorio contiene scripts Node.js para tareas de migración y mantenimiento del sistema.

## migrate-project-images.ts

**Propósito:** Migrar imágenes de proyectos del bucket legacy (`project-image`) a la nueva arquitectura de 3 buckets (`social-assets`) con metadata persistence.

### Quick Start

```bash
# 1. Dry run (ver qué se migraría sin hacer cambios)
tsx scripts/migrate-project-images.ts --dry-run

# 2. Ejecutar migración (seguro, no elimina archivos legacy)
tsx scripts/migrate-project-images.ts

# 3. OPCIONAL: Eliminar archivos legacy después de verificar
tsx scripts/migrate-project-images.ts --delete-old
```

### Qué hace

1. Busca proyectos con `project_image_url` pero sin `image_bucket` (legacy)
2. Descarga imagen del bucket `project-image`
3. Re-sube a `social-assets/projects/{org_id}/{project_id}/gallery/{filename}`
4. Actualiza metadata en DB: `image_bucket` + `image_path`
5. Opcionalmente elimina archivos del bucket legacy

### Flags

- `--dry-run` - Ver qué se migraría sin hacer cambios reales
- `--delete-old` - Eliminar imágenes del bucket legacy después de migración exitosa
- `--skip-missing-org` - Omitir proyectos sin organization_id en lugar de fallar

### Documentación Completa

Ver `prompts/Migration-Guide.md` para:
- Instrucciones paso a paso
- Verificación de resultados
- Manejo de errores
- Rollback procedures
- Casos edge

### Requisitos Previos

1. **Migration SQL ejecutada:**
   ```bash
   # Las columnas image_bucket e image_path deben existir
   psql -f migrations/add_project_image_metadata.sql
   ```

2. **Environment variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Buckets de Supabase:**
   - `project-image` (legacy) debe existir con imágenes
   - `social-assets` (nuevo) debe existir y tener permisos configurados

### Seguridad

- El script NO elimina archivos legacy por defecto (safe)
- Usa `--dry-run` primero siempre
- Valida cada operación con rowCount
- Logging detallado de cada paso
- Maneja errores sin detener migración completa

### Output de Ejemplo

```
╔════════════════════════════════════════════════════════════╗
║   PROJECT IMAGE MIGRATION: Legacy → 3-Bucket Architecture  ║
╚════════════════════════════════════════════════════════════╝

Found 5 project(s) to migrate:
  1. Casa Rodriguez (abc-123)
  2. Edificio Numa (xyz-789)
  ...

[abc-123] Migrating: Casa Rodriguez
  Old URL: https://...project-image/abc123/hero.jpg
  Downloaded 245123 bytes
  ✅ Migration successful

Total:      5
Successful: 4
Failed:     1
Skipped:    0
```

## Agregar Nuevos Scripts

Para agregar scripts de migración:

1. Crear archivo en `scripts/`
2. Importar dependencias necesarias:
   ```typescript
   import { db } from '../server/db';
   import { supabaseAdmin } from '../src/lib/supabaseAdmin';
   ```
3. Agregar flags de CLI con `process.argv.includes()`
4. Implementar logging detallado
5. Manejar errores sin detener migración
6. Agregar al README.md
7. Documentar en `prompts/` si es complejo
