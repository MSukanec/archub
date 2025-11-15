# Guía de Deploy en Vercel

## Problema Identificado

El problema que experimentaste (datos no aparecen en Vercel pero sí en Replit) ocurre porque **Vercel es serverless** y no puede ejecutar el servidor Express tradicional que usas en desarrollo.

## Solución Implementada

He creado **Serverless Functions** para Vercel que reemplazan las rutas de Express. Estas funciones están en la carpeta `/api/` y funcionan automáticamente en Vercel.

### APIs Creadas para Vercel:

✅ **Presupuestos (Budgets)**
- `api/budgets.ts` - GET y POST de presupuestos
- `api/budgets/[id].ts` - PATCH y DELETE de presupuestos

✅ **Items de Presupuesto (Budget Items)**
- `api/budget-items.ts` - GET y POST de items
- `api/budget-items/[id].ts` - PATCH y DELETE de items
- `api/budget-items/move.ts` - Mover items (drag & drop)

✅ **Usuario Actual**
- `api/current-user.ts` - Ya existía

## Variables de Entorno Necesarias en Vercel

Para que las serverless functions funcionen, debes configurar estas variables de entorno en tu proyecto de Vercel:

1. **SUPABASE_URL**
   - Valor: Tu URL de Supabase (ej: `https://xxx.supabase.co`)

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Tu Service Role Key de Supabase (⚠️ NUNCA la anon key)
   - Ubicación en Supabase: Project Settings → API → service_role key

### Cómo Configurar en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega ambas variables
4. Redeploy tu aplicación

## APIs Pendientes

Identifiqué otras APIs que también necesitan serverless functions para funcionar en Vercel:

❌ **Pendientes de Crear:**
- `/api/organization-task-prices` - Precios de tareas de organización
- `/api/subcontract-tasks/:id` - Tareas de subcontratos
- `/api/user/organization-preferences` - Preferencias de usuario

Si necesitas estas funcionalidades en Vercel, puedo crear sus serverless functions siguiendo el mismo patrón.

## Estructura de Archivos

```
/api/
├── current-user.ts                 ✅ Usuario actual
├── budgets.ts                      ✅ GET/POST presupuestos
├── budgets/
│   └── [id].ts                     ✅ PATCH/DELETE presupuesto
├── budget-items.ts                 ✅ GET/POST items
└── budget-items/
    ├── [id].ts                     ✅ PATCH/DELETE item
    └── move.ts                     ✅ Mover items
```

## Notas Importantes

1. **En desarrollo (Replit)**: Usa Express server normal
2. **En producción (Vercel)**: Usa serverless functions automáticamente
3. **Sin cambios en el frontend**: El código funciona igual en ambos entornos
4. **Seguridad RLS**: Las serverless functions respetan las políticas de seguridad de Supabase

## Próximos Pasos

1. ✅ Configurar variables de entorno en Vercel
2. ✅ Hacer deploy
3. ✅ Verificar que los presupuestos aparezcan
4. 📋 Si necesitas más APIs, avísame cuáles
