# 🚀 Desarrollo sin Express - Guía Rápida

## ✅ **LO QUE HICE:**

1. **Eliminé Express completamente** ✓
2. **Creé un servidor de desarrollo custom** (`dev-api-server.ts`) que:
   - Carga variables de entorno desde `.env` y `.env.local`
   - Escanea `/api` y ejecuta las funciones serverless
   - Soporta rutas dinámicas: `[id]`, `[...slug]`, `[[...slug]]`
   - Corre en **puerto 3000**

3. **Actualicé el frontend** (`src/lib/queryClient.ts`) para:
   - Usar `VITE_API_BASE_URL` cuando está definido
   - Apuntar a `http://localhost:3000` en desarrollo

## 🎯 **CÓMO USAR:**

### Opción 1: Script Automático (Recomendado)
```bash
./start-dev.sh
```

### Opción 2: Manual
```bash
# Terminal 1: Dev API Server
npx tsx watch dev-api-server.ts

# Terminal 2: Vite Frontend  
npx vite --host 0.0.0.0
```

## 🌐 **URLs:**
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api/*

## ⚠️ **LIMITACIONES CONOCIDAS:**

1. **File Uploads:** Endpoints que manejan archivos (multipart/form-data) pueden fallar
   - Afecta: `/api/bank-transfer/upload.ts`
   - Solución temporal: Testear en producción (Vercel)

2. **Streaming Responses:** No soportado en este dev server
   - La mayoría de endpoints usan JSON simple, así que no debería afectar

3. **Hot Reload:** El servidor recarga archivos, pero puede necesitar restart manual en algunos casos

## 🔧 **SI ALGO FALLA:**

1. **API no responde:**
   ```bash
   # Verificar que el dev server esté corriendo
   curl http://localhost:3000/api/current-user
   ```

2. **Frontend no se conecta:**
   - Verificar que `.env.local` tenga: `VITE_API_BASE_URL=http://localhost:3000`
   - Recargar la página completamente (Ctrl+Shift+R)

3. **Errores de variables de entorno:**
   - Asegurarte que `.env` tenga todas las keys necesarias (Supabase, etc.)

## 🚀 **PRODUCCIÓN:**

En Vercel, las APIs funcionan directamente como serverless functions. 
No necesitás este dev server en producción.

## 📝 **NOTAS:**

- Este setup NO usa Express (como pediste)
- Las APIs están en `/api/*` (sin cambios)
- El código del frontend no necesita cambios
- Para deploy: push a Vercel normalmente
