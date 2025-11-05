# Sistema de Analytics - Cleanup de Sesiones Abandonadas

## Contexto

Cuando un usuario cierra la app abruptamente (crash, cerrar pestaña, etc.) sin hacer logout, la vista actual queda abierta en la tabla `user_view_history` con `exited_at = NULL`.

Para mantener la base de datos limpia y tener métricas precisas, necesitamos cerrar automáticamente estas sesiones "abandonadas".

---

## Función RPC para Cleanup Automático

Ya está creada en Supabase la siguiente función:

```sql
-- FUNCIÓN: Cerrar sesiones abandonadas después de 5 minutos de inactividad
-- Se puede ejecutar manualmente o desde un cronjob
create or replace function public.analytics_cleanup_abandoned_sessions()
returns integer
language plpgsql
security definer
as $$
declare
  v_closed_count integer;
begin
  -- Cerrar vistas abiertas con más de 5 minutos de antigüedad
  update public.user_view_history
  set exited_at = entered_at + interval '5 minutes',
      duration_seconds = 300
  where exited_at is null
  and entered_at < now() - interval '5 minutes';
  
  -- Retornar cantidad de sesiones cerradas
  get diagnostics v_closed_count = row_count;
  
  return v_closed_count;
end;
$$;
```

---

## Uso Manual (desde Consola Supabase)

Puedes ejecutar esta función desde el SQL Editor de Supabase:

```sql
SELECT analytics_cleanup_abandoned_sessions();
```

Esto retornará el número de sesiones cerradas (ej: `42`).

---

## Configuración de Cronjob (Recomendado)

### Opción A: Supabase Database Webhooks (Nativo)

1. Ve a **Database → Webhooks** en Supabase Dashboard
2. Crea un nuevo webhook con:
   - **Name**: `Analytics Cleanup`
   - **Table**: `user_view_history` 
   - **Events**: `NONE` (lo ejecutaremos por horario)
   - **HTTP Method**: `POST`
   - **URL**: Endpoint propio que ejecute la RPC

### Opción B: Supabase Edge Functions (Serverless)

Crear una Edge Function que se ejecute cada X minutos:

```typescript
// supabase/functions/analytics-cleanup/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  const { data, error } = await supabase
    .rpc('analytics_cleanup_abandoned_sessions');
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      closed_sessions: data 
    }),
    { status: 200 }
  );
});
```

Luego configurar un cron externo (GitHub Actions, Vercel Cron, etc.) que llame a esta función cada 10 minutos.

### Opción C: Vercel Cron Job (Recomendado para Archub)

Crear un endpoint API en tu backend:

```typescript
// server/routes/analytics.ts
router.post('/analytics/cleanup', async (req, res) => {
  // Verificar que la llamada viene de Vercel Cron (secret token)
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { data, error } = await supabase
    .rpc('analytics_cleanup_abandoned_sessions');
  
  if (error) {
    return res.status(500).json({ error });
  }
  
  res.json({ 
    success: true, 
    closed_sessions: data,
    timestamp: new Date().toISOString()
  });
});
```

Y configurar en `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/analytics/cleanup",
    "schedule": "*/10 * * * *"
  }]
}
```

Esto ejecutará el cleanup **cada 10 minutos** automáticamente.

---

## Métricas y Monitoring

Para ver cuántas sesiones se están cerrando automáticamente:

```sql
-- Ver sesiones que se cerraron automáticamente (duración = exactamente 5 minutos)
SELECT 
  view_name,
  COUNT(*) as auto_closed_sessions
FROM user_view_history
WHERE duration_seconds = 300
AND exited_at = entered_at + interval '5 minutes'
GROUP BY view_name
ORDER BY auto_closed_sessions DESC;
```

---

## Recomendación

**Para Archub, recomiendo:**

1. **Implementar Opción C (Vercel Cron)** → Más simple, ya usamos Vercel
2. **Ejecutar cada 10 minutos** → Balance entre precisión y costos
3. **Agregar logging** → Para monitorear cuántas sesiones se cierran

**Beneficios:**
- ✅ Automático, sin intervención manual
- ✅ Métricas más precisas (sesiones cerradas a tiempo)
- ✅ Base de datos limpia
- ✅ Bajo costo (Vercel Cron es gratis en plan Pro)

---

## Estado Actual

- ✅ Función RPC `analytics_cleanup_abandoned_sessions()` creada
- ✅ Sistema de analytics funcionando
- ⏳ **Pendiente:** Configurar cronjob en Vercel (opcional pero recomendado)

Para configurar el cronjob, necesitarás:
1. Crear el endpoint `/api/analytics/cleanup` en el backend
2. Agregar `CRON_SECRET` a las variables de entorno
3. Configurar `vercel.json` con el schedule

¿Querés que implemente el endpoint ahora o lo dejamos para después?
