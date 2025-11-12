# Guía para Crear Modales en Archub

## 🚨 REGLAS FUNDAMENTALES - LEER ANTES DE CREAR UN MODAL

### ✅ Lo que SÍ debemos usar:

1. **FormModalLayout** - SIEMPRE usar este wrapper
2. **FormModalHeader** - SIEMPRE incluir con título, ícono Y DESCRIPCIÓN
3. **FormModalFooter** - SIEMPRE para botones de acción
4. **React Hook Form** con `useForm` de `react-hook-form`
5. **Zod** para validación con `zodResolver`
6. **useMutation** de React Query - NO async/await directo
7. **Form Components** de shadcn: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

### ❌ Lo que NO debemos hacer:

1. ❌ NO usar `useModalPanelStore` directamente - solo si necesitas cambiar panels
2. ❌ NO usar `useEffect` con `setPanel('edit')` a menos que sea necesario
3. ❌ NO hacer llamadas async/await directas en onSubmit
4. ❌ NO olvidar invalidar queries después de mutar
5. ❌ NO olvidar la prop `description` en FormModalHeader
6. ❌ NO crear modales sin seguir este patrón exacto

---

## ⚠️ REGLA CRÍTICA: isEditing en FormModalLayout

**SIEMPRE** que uses `FormModalLayout` para un modal de formulario CRUD (crear/editar), DEBES incluir `isEditing={true}`.

### ❌ ERROR COMÚN - Modal vacío:

```typescript
return (
  <FormModalLayout
    headerContent={headerContent}
    editPanel={editPanel}      // ← Tienes editPanel
    footerContent={footerContent}
    onClose={handleClose}
    // ❌ FALTA isEditing={true}
  />
);
```

### ✅ CORRECTO - Modal muestra formulario:

```typescript
return (
  <FormModalLayout
    columns={1}
    viewPanel={<div></div>}
    editPanel={editPanel}
    headerContent={headerContent}
    footerContent={footerContent}
    onClose={handleClose}
    isEditing={true}           // ← OBLIGATORIO para mostrar editPanel
  />
);
```

### ¿Por qué es necesario?

`FormModalLayout` tiene dos modos:
- `isEditing={false}` (default): Muestra `viewPanel` (para visualización)
- `isEditing={true}`: Muestra `editPanel` (para formularios)

Si omites `isEditing={true}`, el modal usa el default (`false`), intenta mostrar `viewPanel`, y como no lo pasaste, el modal queda vacío.

### Patrón completo para modales CRUD:

```typescript
export function MiFormModal({ modalData, onClose }: MiFormModalProps) {
  // ... setup del formulario ...
  
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos del formulario */}
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar' : 'Nuevo'}
      description="Descripción"
      icon={MiIcono}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}           // ← SIEMPRE INCLUIR
    />
  );
}
```

### Referencias de modales correctos:
- `src/components/modal/modals/admin/AnnouncementFormModal.tsx`
- `src/components/modal/modals/admin/PaymentFormModal.tsx`
- `src/components/modal/modals/admin/PlanFormModal.tsx` (después de este fix)
- `src/components/modal/modals/admin/PlanPriceFormModal.tsx` (después de este fix)

---

## 📋 Patrón Completo de Modal (Copy-Paste Template)

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconName } from 'lucide-react'; // Cambiar IconName por el ícono apropiado
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

// 1. SCHEMA DE VALIDACIÓN ZOD
const mySchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  // ... más campos
});

type MyFormData = z.infer<typeof mySchema>;

// 2. INTERFACE DE PROPS
interface MyEntity {
  id: string;
  title: string;
  // ... más campos
}

interface MyModalProps {
  modalData?: {
    entity?: MyEntity;
    isEditing?: boolean;
  };
  onClose: () => void;
}

// 3. COMPONENTE PRINCIPAL
export function MyModal({ modalData, onClose }: MyModalProps) {
  const { entity, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: userData } = useCurrentUser();

  // 4. CONFIGURAR FORM
  const form = useForm<MyFormData>({
    resolver: zodResolver(mySchema),
    defaultValues: {
      title: entity?.title || '',
      description: entity?.description || '',
      // ... más campos con valores por defecto
    }
  });

  // 5. EFFECT PARA CARGAR DATOS (si es edición)
  React.useEffect(() => {
    if (entity) {
      form.reset({
        title: entity.title || '',
        description: entity.description || '',
        // ... cargar todos los campos
      });
    } else {
      form.reset({
        title: '',
        description: '',
        // ... valores vacíos para crear
      });
    }
  }, [entity, form]);

  // 6. FUNCIÓN DE CIERRE
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // 7. MUTATION PARA CREAR
  const createMutation = useMutation({
    mutationFn: async (data: MyFormData) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('Supabase not initialized or user not found');
      }
      
      const { error } = await supabase
        .from('my_table')
        .insert({
          title: data.title,
          description: data.description || null,
          created_by: userData.user.id,
          // ... más campos
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-entities'] });
      toast({
        title: 'Creado exitosamente',
        description: 'El elemento se creó correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el elemento. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  // 8. MUTATION PARA ACTUALIZAR
  const updateMutation = useMutation({
    mutationFn: async (data: MyFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('my_table')
        .update({
          title: data.title,
          description: data.description || null,
          // ... más campos
        })
        .eq('id', entity!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-entities'] });
      toast({
        title: 'Actualizado exitosamente',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el elemento. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  // 9. HANDLER DE SUBMIT
  const onSubmit = async (data: MyFormData) => {
    setIsLoading(true);
    try {
      if (entity) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 10. PANEL DE EDICIÓN (Formulario)
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el título" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ingresa una descripción"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Opcional: Agrega una descripción detallada
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Más campos aquí */}
      </form>
    </Form>
  );

  // 11. HEADER CON TÍTULO, ÍCONO Y DESCRIPCIÓN
  const headerContent = (
    <FormModalHeader 
      title={entity ? 'Editar Elemento' : 'Nuevo Elemento'}
      description={entity ? 'Actualiza la información del elemento' : 'Crea un nuevo elemento en el sistema'}
      icon={IconName}
    />
  );

  // 12. FOOTER CON BOTONES
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={entity ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  // 13. LAYOUT FINAL
  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>} // Panel vacío si no hay vista previa
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true} // Siempre en modo edición para formularios simples
    />
  );
}
```

---

## 🎯 Checklist de Validación

Antes de dar por terminado un modal, verificar:

- [ ] ✅ Usa `FormModalLayout`, `FormModalHeader`, `FormModalFooter`
- [ ] ✅ FormModalHeader tiene `title`, `description` e `icon`
- [ ] ✅ Usa `useForm` con `zodResolver`
- [ ] ✅ Usa `useMutation` (NO async/await directo)
- [ ] ✅ Invalida queries con `queryClient.invalidateQueries()`
- [ ] ✅ Muestra toast de éxito y error
- [ ] ✅ Reset del form en handleClose
- [ ] ✅ useEffect para cargar datos si es edición
- [ ] ✅ Manejo de isLoading durante submit
- [ ] ✅ Campos con FormField, FormLabel, FormControl, FormMessage
- [ ] ✅ Props correctas: `modalData` y `onClose`

---

## 📚 Ejemplos de Referencia

Buenos ejemplos a seguir en el proyecto:

**Form Modals (con formularios tradicionales):**
- `src/components/modal/modals/admin/NotificationFormModal.tsx`
- `src/components/modal/modals/admin/ChangelogFormModal.tsx`
- `src/components/modal/modals/admin/AnnouncementFormModal.tsx`
- `src/components/modal/modals/organizations/members/PartnerModal.tsx`

**Selection Modals (selección de items):**
- `src/components/modal/modals/construction/ProjectClientModal.tsx`

---

## 🎯 Modales de Selección (Selection Modals)

Para modales que **NO usan formularios** sino que permiten **seleccionar items de una lista/tabla**, seguir este patrón:

### Características de Selection Modals:

1. **NO usan React Hook Form** - No hay `useForm`, `zodResolver`, ni `Form`
2. **Usan Table o List** con `onRowClick` para capturar la selección
3. **Acción ocurre al hacer click** - No hay botón "Guardar/Crear"
4. **Footer solo tiene "Cancelar"** - No tiene `rightLabel` porque la acción ya ocurrió
5. **DEBEN forzar panel 'edit'** - Usar `isEditing={true}` en FormModalLayout

### Template de Selection Modal:

```typescript
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { IconName } from 'lucide-react';

interface MySelectionModalProps {
  projectId?: string;
  onClose: () => void;
}

export function MySelectionModal({ projectId, onClose }: MySelectionModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.organization?.id;

  // Query para obtener items disponibles
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: [`/api/items?organization_id=${organizationId}`],
    enabled: !!organizationId,
  });

  // Mutation que se ejecuta al hacer click en un item
  const selectItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!organizationId || !projectId) throw new Error('Missing IDs');
      return await apiRequest('POST', `/api/projects/${projectId}/items`, {
        item_id: itemId,
        organization_id: organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/items`] });
      toast({
        title: 'Item agregado',
        description: 'El item ha sido agregado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    closeModal();
    onClose();
  };

  const handleItemClick = async (item: any) => {
    setIsLoading(true);
    try {
      await selectItemMutation.mutateAsync(item.id);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
  ];

  const editPanel = (
    <div className="space-y-4">
      <Table
        columns={columns}
        data={items}
        isLoading={isLoadingItems || isLoading}
        onRowClick={handleItemClick}
        emptyStateConfig={{
          icon: <IconName className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay items disponibles',
          description: 'Crea items primero para poder seleccionarlos',
        }}
        className="cursor-pointer"
      />
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title="Seleccionar Item"
      description="Selecciona un item de la lista para agregarlo"
      icon={IconName}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      showLoadingSpinner={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true} // 🚨 CRÍTICO: Esto fuerza el panel edit a ser visible
    />
  );
}
```

### Diferencias clave vs Form Modals:

| Aspecto | Form Modal | Selection Modal |
|---------|------------|-----------------|
| Hook principal | `useForm` | `useState` para loading |
| Componente UI | `Form` + `FormField` | `Table` o `List` |
| Validación | Zod con `zodResolver` | No hay validación |
| Acción principal | Botón "Guardar/Crear" | Click en fila `onRowClick` |
| Footer | Cancelar + Guardar | Solo Cancelar |
| `isEditing` | Opcional | **REQUERIDO**: `true` |

### Checklist para Selection Modals:

- [ ] ✅ NO usa `useForm` ni Zod
- [ ] ✅ Usa `Table` con `onRowClick` o similar
- [ ] ✅ `useMutation` para la acción de selección
- [ ] ✅ Footer solo tiene `leftLabel="Cancelar"` (no rightLabel)
- [ ] ✅ `FormModalLayout` tiene `isEditing={true}`
- [ ] ✅ `handleClose` llama a `closeModal()` y `onClose()`
- [ ] ✅ Loading state mientras ejecuta la mutation
- [ ] ✅ Toast de éxito y error

---

## 🔧 Componentes de Form Comunes

### Input de Texto
```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input placeholder="Placeholder" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea
```typescript
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Descripción</FormLabel>
      <FormControl>
        <Textarea 
          placeholder="Ingresa descripción"
          className="min-h-[100px]"
          {...field} 
        />
      </FormControl>
      <FormDescription>Texto de ayuda opcional</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select / Dropdown
```typescript
<FormField
  control={form.control}
  name="type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="option1">Opción 1</SelectItem>
          <SelectItem value="option2">Opción 2</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Switch / Toggle
```typescript
<FormField
  control={form.control}
  name="isActive"
  render={({ field }) => (
    <FormItem className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Activo</FormLabel>
        <FormDescription>
          Activa o desactiva esta opción
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

### Date/Time Input
```typescript
<FormField
  control={form.control}
  name="date"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Fecha</FormLabel>
      <FormControl>
        <Input type="datetime-local" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## ⚠️ Errores Comunes a Evitar

1. **Olvidar la descripción en FormModalHeader**
   - ❌ `<FormModalHeader title="Título" icon={Icon} />`
   - ✅ `<FormModalHeader title="Título" description="Descripción clara" icon={Icon} />`

2. **Usar async/await en lugar de useMutation**
   - ❌ `const onSubmit = async (data) => { await supabase... }`
   - ✅ Usar `createMutation.mutateAsync(data)` dentro de try/catch

3. **No invalidar queries**
   - ❌ Guardar sin invalidar
   - ✅ `queryClient.invalidateQueries({ queryKey: ['mi-query'] })`

4. **No resetear el form al cerrar**
   - ❌ Solo llamar `onClose()`
   - ✅ `form.reset()` antes de `onClose()`

5. **Formato incorrecto de defaultValues**
   - ❌ Dejar campos undefined
   - ✅ Todos los campos con valores por defecto (aunque sean '')

---

## 🎨 Buenas Prácticas

1. **Nombres descriptivos**: `title`, `description`, `message` son mejores que `text`, `info`
2. **Validación clara**: Mensajes de error en español y descriptivos
3. **Loading states**: Siempre manejar `isLoading` durante mutations
4. **Toast feedback**: Success Y error, nunca silencioso
5. **Accessibility**: Labels claros, placeholders útiles
6. **Organización**: Secciones separadas con borders cuando hay muchos campos
7. **Grid layouts**: Usar `grid grid-cols-2 gap-4` para campos relacionados

---

## 📝 Notas Importantes

- Los modales SIEMPRE deben tener descripción para dar contexto al usuario
- La descripción debe explicar QUÉ se está creando/editando y PARA QUÉ
- Usar íconos apropiados de lucide-react
- Validar con Zod antes de enviar a Supabase
- Manejar errores de Supabase con mensajes claros
- Usar `useCurrentUser()` para obtener el ID del usuario logueado
- Invalidar TODAS las queries relacionadas después de mutar

---

## 🔄 Flujo de Trabajo

1. Definir schema Zod con validaciones
2. Crear interfaces TypeScript
3. Configurar useForm con defaultValues
4. Crear mutations (create + update)
5. Crear onSubmit que usa las mutations
6. Crear editPanel con Form y FormFields
7. Crear headerContent con título, descripción e ícono
8. Crear footerContent con botones
9. Retornar FormModalLayout con todo conectado
10. Probar crear, editar y cerrar

---

**Última actualización**: Noviembre 2024
