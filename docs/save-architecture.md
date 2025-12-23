# Sistema de Guardado Centralizado - Seencel

## Visión General

Seencel utiliza un **sistema de guardado centralizado** inspirado en Notion, Linear y Stripe. Este sistema garantiza:

- **Optimistic Updates**: La UI se actualiza instantáneamente
- **Single Source of Truth**: React Query es la única fuente de verdad
- **Rollback Automático**: Si falla el guardado, la UI se revierte
- **Consistencia**: Todos los flujos usan el mismo patrón

## Arquitectura

```
/core/save-engine/
├── index.ts                    # Exports centralizados
├── useSaveEngine.ts            # Hook principal para auto-save
└── useOptimisticMutation.ts    # Hook para mutaciones puntuales
```

## Cuándo Usar Cada Hook

| Caso de Uso | Hook | Ejemplo |
|-------------|------|---------|
| Auto-save en formularios/vistas | `useSaveEngine` | ProjectBasicDataView |
| Acciones puntuales (click) | `useOptimisticMutation` | Cambiar color, toggle |
| Legacy/Simple | `useAutoSave` | ProfileBasicData |

---

## useSaveEngine - Auto-Save con Optimistic Updates

### Uso Básico

```typescript
import { useSaveEngine } from '@/core/save-engine';

const { isSaving, hasUnsavedChanges, saveNow } = useSaveEngine({
  data: {
    name: projectName,
    description: description,
  },
  queryKey: ['project-data', projectId],
  saveFn: async (data) => {
    const { error } = await supabase
      .from('projects')
      .update(data)
      .eq('id', projectId);
    if (error) throw error;
  },
  delay: 2000,
  enabled: !!projectId,
  additionalQueryKeys: [['projects']],
});
```

### Opciones

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `data` | `T` | requerido | Datos a guardar |
| `queryKey` | `QueryKey` | requerido | Key de React Query para cache |
| `saveFn` | `(data: T) => Promise<void>` | requerido | Función de guardado |
| `delay` | `number` | 2000 | Debounce en ms |
| `enabled` | `boolean` | true | Habilitar/deshabilitar |
| `additionalQueryKeys` | `QueryKey[]` | [] | Keys adicionales para invalidar |
| `showSuccessToast` | `boolean` | false | Mostrar toast al guardar |

### Return Values

| Valor | Tipo | Descripción |
|-------|------|-------------|
| `isSaving` | `boolean` | True mientras guarda |
| `hasUnsavedChanges` | `boolean` | True si hay cambios pendientes |
| `lastSavedAt` | `Date \| null` | Fecha del último guardado |
| `saveNow` | `() => void` | Forzar guardado inmediato |

---

## useOptimisticMutation - Acciones Puntuales

### Uso Básico

```typescript
import { useOptimisticMutation } from '@/core/save-engine';

const { mutate, isPending } = useOptimisticMutation({
  mutationFn: async (color: string) => {
    await supabase.from('projects').update({ color }).eq('id', projectId);
  },
  queryKey: ['project-info', projectId],
  optimisticUpdate: (oldData, newColor) => ({
    ...oldData,
    color: newColor,
  }),
  onSuccessMessage: "Color actualizado",
});

// En onClick:
mutate('#ff0000');
```

---

## Qué NUNCA Hacer

### ❌ PROHIBIDO: Llamar Supabase directamente en componentes

```typescript
// ❌ MAL - No hacer esto
const handleSave = async () => {
  await supabase.from('projects').update({ name }).eq('id', id);
  queryClient.invalidateQueries({ queryKey: ['projects'] });
};
```

### ❌ PROHIBIDO: Usar fetch/axios directamente

```typescript
// ❌ MAL
const response = await fetch('/api/projects', { method: 'PATCH', body: data });
```

### ❌ PROHIBIDO: Invalidar queries manualmente sin patrón

```typescript
// ❌ MAL - Invalidaciones sueltas causan inconsistencias
queryClient.invalidateQueries({ queryKey: ['projects'] });
queryClient.invalidateQueries({ queryKey: ['project-data'] });
```

---

## Qué SÍ Hacer

### ✅ CORRECTO: Usar useSaveEngine para auto-save

```typescript
// ✅ BIEN
const { isSaving } = useSaveEngine({
  data: formData,
  queryKey: ['my-data', id],
  saveFn: async (data) => {
    // Lógica de guardado
  },
  additionalQueryKeys: [['related-data']],
});
```

### ✅ CORRECTO: Usar useOptimisticMutation para acciones

```typescript
// ✅ BIEN
const { mutate } = useOptimisticMutation({
  mutationFn: async (value) => { /* ... */ },
  queryKey: ['my-data', id],
  optimisticUpdate: (old, newValue) => ({ ...old, field: newValue }),
});
```

---

## Migración de Código Legacy

### Antes (Legacy)

```typescript
const saveMutation = useMutation({
  mutationFn: async (data) => {
    await supabase.from('table').update(data).eq('id', id);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['data'] });
    toast({ title: "Guardado" });
  },
  onError: () => {
    toast({ title: "Error", variant: "destructive" });
  },
});

useAutoSave({
  data: formData,
  saveFn: async (data) => saveMutation.mutateAsync(data),
  delay: 3000,
  enabled: !!id,
});
```

### Después (Save Engine)

```typescript
const { isSaving } = useSaveEngine({
  data: formData,
  queryKey: ['data', id],
  saveFn: async (data) => {
    const { error } = await supabase.from('table').update(data).eq('id', id);
    if (error) throw error;
  },
  delay: 2000,
  enabled: !!id,
});
```

---

## Features Migradas

| Feature | Vista/Modal | Estado |
|---------|-------------|--------|
| Projects | ProjectBasicDataView | ✅ Migrado |
| Projects | ProjectLocationView | ✅ Migrado |
| Profile | ProfileBasicData | 🔄 Usa useAutoSave (legacy funcional) |

---

## Troubleshooting

### "Los cambios no se guardan"

1. Verificar que `enabled` sea `true`
2. Revisar console.log para mensajes de `[SaveEngine]`
3. Verificar que `data` realmente cambió (no solo referencia)

### "Se guarda al cargar la página"

El engine detecta automáticamente "initial data loading" y lo ignora. Si persiste:
1. Verificar que el `queryKey` sea correcto
2. Revisar que `enabled` dependa de datos cargados

### "Los cambios se revierten"

Esto es el rollback automático funcionando:
1. Revisar console.error para el error real
2. Verificar permisos en Supabase
3. Verificar que los datos sean válidos

---

## Changelog

- **2024-12-23**: Creación del sistema save-engine
- **2024-12-23**: Migración de ProjectBasicDataView y ProjectLocationView
