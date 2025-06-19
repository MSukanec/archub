---
📁 prompts/ai-page-template.md
---

# 🧠 Archub – AI Page Generation Template

Este archivo define todas las **reglas base** que Replit AI debe seguir al crear nuevas páginas dentro del proyecto Archub.
Usalo como **contexto previo obligatorio** antes de generar cualquier componente, página o vista.

---

## 🧩 Estructura de cada página

Toda nueva página debe seguir esta estructura exacta:

1. **Importar los siguientes componentes:**
   - `CustomPageLayout`
   - `CustomPageHeader`
   - `CustomPageBody`
   - `CustomTable` (si hay tabla)
   - `CustomSearchButton` (si hay filtros o búsqueda)

2. **Usar la estructura principal de layout SPA**
   - El layout general se define en `App.tsx`
   - El `Sidebar` y el `Header` están centralizados y no deben ser reimplementados

3. **Componentes obligatorios por página:**
   ```tsx
   <CustomPageLayout
     icon={...}
     title="Título de la Página"
     description="Descripción corta de la página"
     actions={<Button>Acción</Button>}
     searchValue={searchValue}
     onSearchChange={setSearchValue}
     filters={filters}
     onClearFilters={handleClearFilters}
   >
     <CustomPageHeader ... />
     <CustomPageBody>
       {/* Acá va el contenido principal */}
     </CustomPageBody>
   </CustomPageLayout>
   ```

---

## 🎨 Estilos

- Solo usar clases definidas en `index.css` con Tailwind CSS
- No se deben escribir estilos inline ni clases inventadas
- Seguir paleta de colores y tokens definidos

---

## 📚 Componentes preexistentes

- `CustomPageLayout`: wrapper visual de toda la página
- `CustomPageHeader`: encabezado superior con título, ícono, descripción y acciones
- `CustomPageBody`: contenedor principal del contenido
- `CustomTable`: tabla optimizada con encabezados dinámicos y data
- `CustomSearchButton`: botón para filtros, siempre después del input de búsqueda

---

## 🔄 Convenciones globales

- Estado global: usar Zustand (authStore, navigationStore, themeStore)
- Data: usar React Query (`useQuery`, `useMutation`)
- Autenticación y datos del usuario: 
  - Hacer siempre: `supabase.rpc('archub_get_user')`
  - No usar llamadas directas a tablas como `users`, `organizations`, etc.
- Navegación: SPA con Wouter, sin rutas anidadas

---

## 🛑 Qué evitar

- No repetir layout o estructura visual ya definida
- No usar componentes nativos como `<table>`, `<h1>`, etc. sin estilo
- No traer datos directamente con `supabase.from()` (solo RPC)
- No hardcodear permisos ni datos, todo viene desde el contexto de usuario

---

## ✅ Ejemplo de flujo mínimo para una nueva página

1. Cargar `archub_get_user()` con React Query
2. Usar `CustomPageLayout`
3. Agregar `CustomPageHeader` con título, descripción, ícono
4. Agregar `CustomPageBody` como contenedor principal
5. Agregar `CustomTable` o contenido dinámico dentro del body
6. Agregar `CustomSearchButton` si aplica

---

Este archivo es el **contexto de desarrollo oficial** de Archub.  
Toda generación de código por IA debe respetar este estándar.
