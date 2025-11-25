# Delete/Replace Pattern - Seencel SaaS Standard

## 🎯 Objetivo

Implementar eliminación de entidades con opción de reemplazo, permitiendo que los datos relacionados se migren a otra entidad sin perder referencias. Esto es un patrón **universal SaaS Premium** reutilizable en cualquier feature.

---

## 🏗️ Arquitectura del Patrón

El patrón tiene **3 capas claramente separadas**:

### Capa 1: MODAL (UI PURA - Sin lógica de negocio)
**Archivo**: `src/components/forms/DeleteConfirmationForm.tsx`

Responsabilidades:
- ✅ Renderizar advertencias y consecuencias
- ✅ Mostrar ComboBox si `mode === 'replace'`
- ✅ Llamar callbacks (`onDelete`, `onReplace`)
- ❌ NO ejecuta mutaciones
- ❌ NO conoce tablas de DB
- ❌ NO tiene queries

**Props esperadas**:
```tsx
modalData: {
  mode: 'delete' | 'replace'
  title: string
  description: string
  itemName: string
  consequences?: string[]
  replacementOptions?: { label: string; value: string }[]
  currentId?: string
  onDelete: () => void
  onReplace?: (newId: string) => void
}
```

---

### Capa 2: FEATURE MUTATIONS (Lógica de DB)
**Ubicación**: `src/features/<feature>/services/` + `src/features/<feature>/hooks/`

Archivos necesarios para feature X:

**1. Servicio de Delete** (ya existe típicamente):
```typescript
// src/features/<feature>/services/delete<Entity>.ts
export async function delete<Entity>(id: string): Promise<string> {
  // Soft delete: UPDATE tabla SET is_deleted = true, deleted_at = NOW()
  // O DELETE directo si no tiene is_deleted
  return supabase
    .from('<table>')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
}
```

**2. Servicio de Replace** (NUEVO):
```typescript
// src/features/<feature>/services/replace<Entity>.ts
export async function replace<Entity>(oldId: string, newId: string): Promise<{ oldId; newId }> {
  // PASO 1: Actualizar TODAS las referencias del item antiguo al nuevo
  await supabase
    .from('<related_table>')
    .update({ <foreign_key>: newId })
    .eq('<foreign_key>', oldId)

  // PASO 2: Eliminar el item antiguo (soft delete)
  await supabase
    .from('<table>')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', oldId)

  return { oldId, newId }
}
```

**3. Hook de Delete** (ya existe típicamente):
```typescript
// src/features/<feature>/hooks/use-delete-<entity>.ts
export function useDelete<Entity>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => delete<Entity>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: <QUERY_KEY_FOR_ENTITY_LIST> 
      })
      toast({ title: 'Eliminado', description: '...' })
    }
  })
}
```

**4. Hook de Replace** (NUEVO):
```typescript
// src/features/<feature>/hooks/use-replace-<entity>.ts
export function useReplace<Entity>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oldId, newId }: { oldId: string; newId: string }) =>
      replace<Entity>(oldId, newId),
    onSuccess: () => {
      // Invalidar AMBAS queries: la entidad Y sus referencias
      queryClient.invalidateQueries({ 
        queryKey: <QUERY_KEY_FOR_ENTITY_LIST> 
      })
      queryClient.invalidateQueries({ 
        queryKey: <QUERY_KEY_FOR_RELATED_ITEMS> 
      })
      toast({ 
        title: 'Reemplazado',
        description: 'Los datos fueron migrados correctamente'
      })
    }
  })
}
```

---

### Capa 3: PAGE/COMPONENT (Orquestación)
**Ubicación**: Página o componente que lista los items (ej: `GeneralCostsList.tsx`)

```tsx
import { useDelete<Entity> } from '@/features/<feature>/hooks/use-delete-<entity>'
import { useReplace<Entity> } from '@/features/<feature>/hooks/use-replace-<entity>'

export default function <Entity>List() {
  const { openModal } = useGlobalModalStore()
  const delete<Entity> = useDelete<Entity>()
  const replace<Entity> = useReplace<Entity>()
  
  const [<entities>] = useQuery(...) // Lista de items
  const [relatedItems] = useQuery(...) // Items relacionados

  const handleDelete = (item) => {
    // PASO 1: Filtrar items relacionados a este item
    const associated = relatedItems.filter(r => r.<foreign_key> === item.id)
    
    // PASO 2: Contar si hay otros items disponibles para reemplazo
    const otherItems = <entities>.filter(e => e.id !== item.id)
    const canReplace = associated.length > 0 && otherItems.length > 0
    
    // PASO 3: Armar array de consecuencias
    const consequences = []
    if (associated.length > 0) {
      consequences.push(
        `${associated.length} item${associated.length === 1 ? '' : 's'} relacionado${associated.length === 1 ? '' : 's'} será${associated.length === 1 ? 'á' : 'n'} afectado${associated.length === 1 ? '' : 's'}`
      )
      if (canReplace) {
        consequences.push('Puedes reemplazarlos con otro o dejarlos sin referencia')
      } else {
        consequences.push('Los items quedarán sin referencia')
      }
    }
    
    // PASO 4: Armar opciones de reemplazo
    const replacementOptions = otherItems.map(e => ({
      label: e.name, // o el campo que identifique al item
      value: e.id
    }))
    
    // PASO 5: Abrir modal con toda la data
    openModal('delete-confirmation', {
      mode: canReplace ? 'replace' : 'delete',
      title: `Eliminar ${itemType}`,
      description: `¿Estás seguro de que quieres eliminar "${item.name}"?`,
      itemName: item.name,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: canReplace ? replacementOptions : undefined,
      currentId: item.id,
      onDelete: () => {
        delete<Entity>.mutate(item.id)
      },
      onReplace: (newId) => {
        replace<Entity>.mutate({ oldId: item.id, newId })
      }
    })
  }

  return (
    <Table
      data={<entities>}
      rowActions={(item) => [
        {
          icon: Trash2,
          label: 'Eliminar',
          onClick: () => handleDelete(item),
          variant: 'destructive'
        }
      ]}
    />
  )
}
```

---

## ✅ Checklist de Implementación

Para implementar este patrón en **cualquier feature**:

- [ ] **Servicio de Delete** existe (típicamente ya)
- [ ] **Servicio de Replace** creado: `src/features/<feature>/services/replace<Entity>.ts`
- [ ] **Hook de Delete** existe (típicamente ya)
- [ ] **Hook de Replace** creado: `src/features/<feature>/hooks/use-replace-<entity>.ts`
- [ ] **Hook importado** en la página
- [ ] **handleDelete() función** arma: `consequences`, `mode`, `replacementOptions`
- [ ] **openModal() llamada** con todos los parámetros necesarios
- [ ] **onDelete callback** ejecuta `delete<Entity>.mutate(id)`
- [ ] **onReplace callback** ejecuta `replace<Entity>.mutate({ oldId, newId })`
- [ ] **Query invalidation** toca AMBAS: entidad Y items relacionados

---

## 📋 Ejemplos Implementados

### ✅ GeneralCostsList (COMPLETO)
**Ubicación**: `src/pages/general-costs/GeneralCostsList.tsx`

Lo que hace:
1. Cuenta pagos asociados a cada concepto
2. Si hay pagos + otros conceptos → `mode: 'replace'`
3. Si no hay pagos → `mode: 'delete'`
4. Arma consecuencias dinámicas
5. Llama mutaciones de delete o replace

**Servicios usados**:
- `deleteGeneralCost()` en `src/features/general-costs/services/deleteGeneralCost.ts`
- `replaceGeneralCost()` en `src/features/general-costs/services/replaceGeneralCost.ts`

**Hooks usados**:
- `useDeleteGeneralCost()` en `src/features/general-costs/hooks/use-delete-general-cost.ts`
- `useReplaceGeneralCost()` en `src/features/general-costs/hooks/use-replace-general-cost.ts`

---

## 🔧 Cómo Pedir Cambios

Cuando necesites aplicar este patrón a una página X, di:

> "Ajusta `src/pages/X.tsx` al Delete/Replace Pattern"

Yo automáticamente:
1. Buscaré la página y su feature
2. Crearé/verificaré los servicios de delete + replace
3. Crearé/verificaré los hooks
4. Modificaré la página para orquestar el modal correctamente
5. Verificaré que invalide caches apropiadamente

---

## 🚨 Errores Comunes a Evitar

### ❌ Error 1: No invalidar ambas queries
```tsx
// MALO
queryClient.invalidateQueries({ queryKey: ['items'] })

// BIEN
queryClient.invalidateQueries({ queryKey: ['items'] })
queryClient.invalidateQueries({ queryKey: ['related-items'] })
```

### ❌ Error 2: Lógica de reemplazo en el servicio incorrecta
```tsx
// MALO - Orden incorrecto (elimina ANTES de actualizar)
await delete()
await update()

// BIEN - Actualizar PRIMERO, LUEGO eliminar
await update({ <fk>: newId })
await delete()
```

### ❌ Error 3: No contar "otros items" disponibles
```tsx
// MALO - Siempre muestra "replace" aunque no hay opciones
const mode = associatedPayments.length > 0 ? 'replace' : 'delete'

// BIEN - Verifica que haya alternativas
const mode = associatedPayments.length > 0 && otherItems.length > 0 ? 'replace' : 'delete'
```

### ❌ Error 4: No filtrar el item actual en replacementOptions
```tsx
// MALO - El usuario podría "reemplazar con el mismo"
const options = items.map(i => ({ label: i.name, value: i.id }))

// BIEN - Excluir el que se va a eliminar
const options = items
  .filter(i => i.id !== itemToDelete.id)
  .map(i => ({ label: i.name, value: i.id }))
```

### ❌ Error 5: Modal con lógica de negocio
```tsx
// MALO - El modal ejecuta delete directamente
onDelete: () => supabase.from('table').delete()

// BIEN - El modal solo llama callback, la mutación está en el hook
onDelete: () => deleteGeneralCost.mutate(id)
```

---

## 🎨 Detalles de UX

### Modo "DELETE" (sin reemplazo disponible)
```
┌─────────────────────────────────┐
│ Eliminar concepto de gasto      │
├─────────────────────────────────┤
│ ⚠️  Esta acción no se puede     │
│    deshacer                     │
│                                 │
│ ¿Estás seguro de que quieres    │
│ eliminar "Servicios..."?        │
│                                 │
│ ¿Qué pasará?                    │
│ • 5 pagos quedarán sin ref...  │
│ • Los reportes se verán...      │
│                                 │
│ [Cancelar] [Eliminar]           │
└─────────────────────────────────┘
```

### Modo "REPLACE" (con opciones)
```
┌─────────────────────────────────┐
│ Eliminar concepto de gasto      │
├─────────────────────────────────┤
│ ⚠️  Esta acción no se puede     │
│    deshacer                     │
│                                 │
│ ¿Qué acción querés realizar?    │
│ ○ Eliminar definitivamente      │
│ ○ Reemplazar por otro [✓]       │
│                                 │
│ Selecciona el reemplazo         │
│ [Otros servicios ▼]             │
│                                 │
│ ⚠️  Esto reemplazará todas...   │
│                                 │
│ [Cancelar] [Reemplazar]         │
└─────────────────────────────────┘
```

---

## 🔗 Referencias

- **Modal Implementation**: `src/components/forms/DeleteConfirmationForm.tsx`
- **Documentation**: `prompts/Modal-Standard.md` (Sección 16)
- **Example Feature**: `src/features/general-costs/`
- **Example Page**: `src/pages/general-costs/GeneralCostsList.tsx`

---

## 💡 Tips Avanzados

### Caso: Reemplazo recursivo (A → B → C)
Si una entidad puede reemplazar a otra que también tiene referencias:
```tsx
// El modal debe permitir "múltiples niveles"
// La mutación de replace DEBE actualizar TODAS las referencias,
// incluso las que apuntan a otros items que van a ser reemplazados
```

### Caso: Notificaciones de reemplazo masivo
```tsx
onSuccess: () => {
  toast({
    title: 'Reemplazado exitosamente',
    description: `${countAffected} items fueron migrados`
  })
}
```

### Caso: Auditoría/Logs
```tsx
// En el backend, registrar quién reemplazó qué y cuándo
// Útil para compliance y debugging
```

---

## ✨ Flujo Visual Completo

```
Usuario hace clic en Eliminar
         ↓
¿Hay items relacionados?
     ↙         ↘
   NO          SI
    ↓          ↓
mode=delete  ¿Hay otros items?
    ↓         ↙      ↘
   Modal    NO       SI
    ↓               ↓
   Abre      mode=replace
    ↓               ↓
Usuario              Modal
elige                Abre
"Eliminar"           ↓
    ↓         Usuario elige:
deleteX()      Delete / Replace
    ↓              ↙     ↘
Concepto      deleteX() replaceX()
eliminado         ↓       ↓
                Concepto  Pagos migrados
                eliminado + Concepto
                          eliminado
```

---

**Esta es la fuente de verdad para este patrón. Refiero aquí cada vez que necesites aplicarlo a una nueva entidad.** ✅
