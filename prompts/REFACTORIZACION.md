# Guía de Refactorización de Páginas

Este documento contiene las instrucciones para refactorizar páginas de Seencel siguiendo los estándares actuales del proyecto.

---

## 1. Tablas (`Table`)

### 1.1 Componente a Usar
- Usar siempre el componente de `src/components/shared/table` según la lógica documentada en `src/components/shared/table/AUDIT.md`.

### 1.2 Sistema de Anchos Semánticos

**IMPORTANTE:** Cuando refactorices una tabla:
1. Asigna un tipo semántico a TODAS las columnas (no dejar ninguna sin tipo)
2. Los anchos se definen automáticamente según el tipo semántico
3. Pregunta al usuario cuál columna debería ser `long-text` (ocupar ancho restante)

Las columnas deben usar el sistema de **tipos semánticos** para definir su ancho automáticamente. Ver `src/components/shared/table/tableColumnTypes.ts`.

**Tipos disponibles:**

| Tipo | Ancho | Uso |
|------|-------|-----|
| `date` | 110px | Fechas simples |
| `datetime` | 150px | Fecha + hora |
| `amount` | 120px | Montos monetarios |
| `status` | 100px | Estados/badges pequeños |
| `wallet` | 140px | Billeteras/cuentas |
| `number` | 80px | Números simples |
| `id` | 100px | Identificadores |
| `actions` | 48px | Columna de acciones |
| `name` | 200px | Nombres de entidades |
| `email` | 200px | Emails |
| `short-text` | 140px | Texto corto (DEFAULT) |
| `medium-text` | 180px | Texto medio |
| `long-text` | FLEXIBLE | Ocupa el ancho restante |
| `badge` | 120px | Badges/etiquetas |
| `avatar` | 48px | Avatares |
| `checkbox` | 40px | Checkboxes |
| `icon` | 40px | Iconos |

### 1.3 Columna Flexible (`long-text`)

Cuando refactorices una tabla, **SIEMPRE pregunta cuál columna debería tomar el ancho restante** (tipo `long-text`). Esta columna:

- Absorbe todo el espacio sobrante de la tabla
- Garantiza que la tabla ocupe el 100% del ancho disponible
- Solo debe haber **UNA** columna `long-text` por tabla (recomendado)

**Ejemplo:** En la tabla de Organizaciones, la columna "Organización" usa `type: 'long-text'` para ocupar el espacio restante.

### 1.4 Ajuste de Anchos al Refactorizar

**NUNCA dejes columnas sin tipo semántico.** Al refactorizar:
- Revisa TODAS las columnas
- Asigna el tipo más apropiado a cada una
- Si una columna necesita ancho fijo personalizado, primero intenta usar un tipo semántico
- Si no hay tipo que encaje, consulta con el usuario

### 1.5 Ejemplo de Columna con Tipo Semántico

```typescript
const columns = [
  {
    key: 'created_at',
    label: 'Fecha',
    type: 'date' as const,  // ← Tipo semántico
    render: (item) => formatDate(item.created_at)
  },
  {
    key: 'name',
    label: 'Nombre',
    type: 'long-text' as const,  // ← Esta absorbe el ancho restante
    render: (item) => item.name
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'status' as const,
    render: (item) => <Badge>{item.status}</Badge>
  }
];
```

---

## 2. Badges

### 2.1 Sistema Semántico de Badges

**IMPORTANTE:** Cuando refactorices una tabla con badges:
1. Identifica TODOS los badges en esa página
2. Refactoriza cada badge para usar el componente `Badge.tsx` con variantes semánticas
3. Cada variante ya tiene:
   - Color automático (100% en contenido, 10% de opacidad en fondo)
   - Icono fijo SIEMPRE (algunos badges pueden no tener icono si se especifica)

### 2.2 Variantes Disponibles

Todas estas variantes están definidas en `src/components/ui/badge.tsx`:

| Variante | Icono | Uso |
|----------|-------|-----|
| `success` | ✓ Check | Éxito, completado |
| `error` | ✓ XCircle | Error, fallido |
| `warning` | ✓ AlertTriangle | Advertencia |
| `pending` | ✓ AlertCircle | Pendiente, en espera |
| `info` | ✓ Info | Información |
| `neutral` | ✓ AlertCircle | Neutral, sin categoría |
| `status-active` | ✓ Play | En proceso |
| `status-completed` | ✓ Check | Completado |
| `status-paused` | ✓ Pause | Pausado |
| `status-cancelled` | ✓ X | Cancelado |
| `status-planning` | ✓ Calendar | Planificación |
| `plan-pro` | ✓ Check | Plan Pro |
| `plan-free` | ✓ Check | Plan Free |
| `plan-teams` | ✓ Check | Plan Teams |
| `plan-enterprise` | ✓ Check | Plan Enterprise |

### 2.3 Badges SIN Icono

Para casos especiales donde el badge NO debe tener icono:
1. Crea una nueva variante SIN icono (ej: `type-neutral`)
2. Define solo el color, sin icono en `variantIcons`
3. Declara esto en el comentario de la variante

**Ejemplo:** Badge de tipo de contacto sin icono (solo color):

```typescript
// En badge.tsx, si necesitas un tipo sin icono:
type ContactType = 'client' | 'supplier' | 'partner'; // Será refactorizado como badge-type-neutral sin icono
```

### 2.4 Regla de Refactorización de Badges

**Cuando refactorices una tabla o página:**
- Busca TODOS los badges en esa página
- Cámbia cualquier badge con color hardcodeado a una variante semántica
- Si un badge necesita comportamiento especial, crea una nueva variante en `badge.tsx`
- NUNCA hardcodees colores directamente en el componente Badge

---

## 3. Headers de Página

### 3.1 Estándares Básicos

- La página debe tener en su header el **mismo ícono** que en su sidebar.
- El header debe tener una **descripción** en su prop `description`.

### 3.2 Botones y Acciones en el Header

**IMPORTANTE:** NUNCA hardcodees botones en el header. Siempre usa las props diseñadas para tal fin:

1. **Para botones primarios:** Usa la prop `actionButton`
   - Proporciona `{ label, icon, onClick }`
   - Aparece en el header con estilo automático

2. **Para múltiples acciones/dropdowns:** Usa la prop `actions`
   - Acepta un array de componentes JSX
   - Los componentes dentro deben usar los estilos correctos del sistema (ej: `bg-accent text-white`)
   - Evita usar `variant="outline"` para botones principales

3. **Ejemplo correcto** (de GeneralCosts.tsx):
   ```typescript
   const getPeriodSelector = () => {
     if (activeTab !== "dashboard") return []
     return [
       <DropdownMenu key="period-selector">
         <DropdownMenuTrigger
           className="bg-accent text-white hover:bg-accent/90 rounded-lg px-3 py-1.5 gap-2 text-sm font-medium shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 inline-flex items-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
         >
           {/* contenido */}
         </DropdownMenuTrigger>
       </DropdownMenu>
     ]
   }
   
   // Luego en headerProps:
   actions: getPeriodSelector()
   ```

4. **Estilos predefinidos para botones en actions:**
   - Usa `className="bg-accent text-white"` para botones principales
   - Usa `className="h-8 px-3 text-xs"` para tamaño pequeño
   - Incluye siempre hover effects y transitions

---

## 4. IdentityBadge

Para mostrar entidades con avatar (usuarios, organizaciones), usar `src/components/shared/IdentityBadge.tsx`:

```typescript
<IdentityBadge
  name={organization.name}
  avatarUrl={organization.image_url}
  size="sm"
  showName={true}
/>
```

---

## 5. Checklist de Refactorización

Antes de considerar una página refactorizada, verificar:

- [ ] Tabla usa `src/components/shared/table`
- [ ] TODAS las columnas tienen un tipo semántico asignado
- [ ] Una columna tiene `type: 'long-text'` para ancho flexible (confirmado con usuario)
- [ ] Badges usan variantes semánticas de `Badge.tsx`
- [ ] Badges en la página refactorizada no tienen colores hardcodeados
- [ ] Header tiene ícono y descripción
- [ ] Entidades con avatar usan `IdentityBadge`
