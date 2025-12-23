# 📋 FEATURE AUDIT - Plantilla de Auditoría de Seencel

> **IMPORTANTE:** Este es un **TEMPLATE GLOBAL**. 
> 
> Cuando audites un feature, **crea una copia de este documento en la carpeta del feature** para documentar los hallazgos específicos.

---

## Dónde va el FEATURE-AUDIT.md de cada feature

**Ubicación estándar:**
```
src/features/{feature-name}/FEATURE-AUDIT.md
```

**Ejemplos:**
- `src/features/organization/FEATURE-AUDIT.md` ← Auditoría completada del feature ORGANIZATION
- `src/features/projects/FEATURE-AUDIT.md` ← Auditoría completada del feature PROJECTS
- `src/features/learning/FEATURE-AUDIT.md` ← Auditoría completada del feature LEARNING

---

## Cómo usar este documento

### Paso 1: Copia la plantilla
Cuando audites un nuevo feature, copia este archivo:
```bash
cp prompts/FEATURE-AUDIT.md src/features/{feature-name}/FEATURE-AUDIT.md
```

### Paso 2: Modifica el título
Cambia el título a:
```markdown
# FEATURE AUDIT: {NOMBRE_DEL_FEATURE}
```

### Paso 3: Completa cada sección
Sigue cada sección de la auditoría (2, 3, 4, etc.) y marca con ✅ / ❌ lo completado.

### Paso 4: Documenta hallazgos
Incluye:
- Issues encontrados
- Fixes aplicados
- Warnings o mejoras futuras
- Estado final (✅ CERRADO / 🟡 ABIERTO / 🔴 BLOQUEADO)

---

## Contenido de la plantilla

El contenido completo está disponible en el repositorio como referencia:

**Secciones principales:**
1. ✅ Objetivo
2. ✅ Fuera de Alcance
3. ✅ Cómo Usar
4. ✅ Reglas de Seguridad
5. ✅ Regla de STOP
6. ✅ Auditoría Completa
   - 1. Mapa del Feature
   - 2. Arquitectura de Features
   - 3. Ubicación de Archivos y Duplicados
   - 4. Páginas (3 Capas)
   - 5. Formularios (Forms)
   - 5.1 Sistema de Guardado (Save Engine)
   - 6. Modales
   - 7. Drawers
   - 8. Uploads/Storage
   - 9. Delete/Replace Pattern
   - 10. Base de Datos
   - 11. Frontend
   - 12. Código Limpio
   - 13. Calidad/Robustez
   - 14. Refactorización (Tablas, Badges, Headers)
   - 15. Quality Gates (Testing)
   - 16. Accesibilidad e i18n
   - 17. Production Readiness
7. ✅ Entregables Obligatorios
8. ✅ Condición Final
9. ✅ Regla Post-Cierre
10. ✅ Guías de Sistemas Específicos
11. ✅ Reglas para Prompts Externos

---

## Sistema de Guardado (Save Engine) - Referencia Rápida

El feature ORGANIZATION completó la migración a **Save Engine**:
- ✅ `useSaveEngine` para auto-save
- ✅ `useOptimisticMutation` para acciones puntuales
- ✅ `if (!oldData) return oldData;` guardia en todos los optimisticUpdate
- ✅ `additionalQueryKeys` para invalidación correcta
- ✅ 0 llamadas directas a Supabase en componentes
- ✅ 0 instancias de `useMutation` legacy

**Documentación:** `/docs/save-architecture.md`

---

## Referencias y Links

- **Save Engine Source:** `/src/core/save-engine/`
- **Save Architecture Docs:** `/docs/save-architecture.md`
- **Table Architecture:** `/src/components/shared/table/AUDIT.md`
- **Ejemplo Completado:** `/src/features/organization/FEATURE-AUDIT.md`

---

## Checklist Rápido para Auditar un Feature

- [ ] ¿Estructura correcta de carpetas? (services/, hooks/, forms/, etc.)
- [ ] ¿Todos los forms migrados a useOptimisticMutation o useSaveEngine?
- [ ] ¿Guardia `if (!oldData) return oldData;` en todos los optimisticUpdate?
- [ ] ¿additionalQueryKeys especificados correctamente?
- [ ] ¿0 supabase.from() directo en componentes?
- [ ] ¿0 console.log() de debug?
- [ ] ¿Páginas + Views en carpetas correctas?
- [ ] ¿Modales registrados en registerModals.ts?
- [ ] ¿Exports correctos en index.ts del feature?
- [ ] ¿Tablas usan componentes compartidos?
- [ ] ¿Badges usan variantes semánticas?
- [ ] ¿Testing mínimo cubierto?

---

## Estado de Auditorías Completadas

| Feature | Estado | Ubicación del Audit | Fecha |
|---------|--------|-------------------|-------|
| **ORGANIZATION** | ✅ CERRADO | `/src/features/organization/FEATURE-AUDIT.md` | 2025-12-23 |
| PROJECTS | ✅ CERRADO | `/src/features/projects/FEATURE-AUDIT.md` | TBD |
| Otros features | ⏳ PENDIENTE | TBD | TBD |

---

**Mantén este documento actualizado conforme audites más features.**
