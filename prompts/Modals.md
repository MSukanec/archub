# Guía para Crear Modales en Seencel

## 📁 ARQUITECTURA DE CARPETAS

La carpeta `src/components/modal/` está organizada siguiendo estándares empresariales:

```
src/components/modal/
├── foundation/          # Componentes base del modal (UI primitivos)
│   ├── ModalLayout.tsx         # Layout principal que combina header/body/footer
│   ├── ModalHeader.tsx         # Cabecera con título, ícono, descripción
│   ├── ModalBody.tsx           # Cuerpo scrolleable
│   ├── ModalFooter.tsx         # Pie con botones de acción
│   ├── ModalStepHeader.tsx     # Header para modales multi-paso
│   ├── ModalStepFooter.tsx     # Footer para modales multi-paso
│   ├── ModalSectionButton.tsx  # Botón para subsecciones
│   └── index.ts
├── state/               # Estado global (Zustand stores)
│   ├── globalModalStore.ts     # Store para abrir/cerrar modales
│   ├── panelStore.ts           # Store para paneles (view/edit/subform)
│   └── index.ts
├── factory/             # Factory pattern para registro de modales
│   ├── ModalFactory.tsx        # Renderiza el modal correcto según type
│   ├── types.ts                # Tipos de modales y datos
│   └── index.ts
├── utils/               # Utilidades
│   ├── ModalErrorBoundary.tsx  # Manejo de errores
│   ├── modal-readiness.tsx     # Hook para verificar datos listos
│   └── modal-best-practices.tsx
└── index.ts             # Barrel export principal
```

## 🎯 CONCEPTO CLAVE: Modal vs Form

**CRÍTICO:** Entender la diferencia:

- **Modal** = CONTENEDOR visual (caja, overlay, estructura)
- **Form** = CONTENIDO (campos, validaciones, lógica de negocio)

Los componentes `Modal*` son primitivos UI reutilizables. Los forms son el contenido que va DENTRO del modal. Esta separación permite:
1. Reutilizar la misma estructura visual en diferentes contextos
2. Cambiar el contenido sin modificar el contenedor
3. Mantener la consistencia visual en toda la aplicación

---

## 🚨 REGLAS FUNDAMENTALES - LEER ANTES DE CREAR UN MODAL

### ✅ Lo que SÍ debemos usar:

1. **ModalLayout** - SIEMPRE usar este wrapper
2. **ModalHeader** - SIEMPRE incluir con título, ícono Y DESCRIPCIÓN
3. **ModalFooter** - SIEMPRE para botones de acción
4. **React Hook Form** con `useForm` de `react-hook-form`
5. **Zod** para validación con `zodResolver`
6. **useMutation** de React Query - NO async/await directo
7. **Form Components** de shadcn: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

### ❌ Lo que NO debemos hacer:

1. ❌ NO usar `useModalPanelStore` directamente - solo si necesitas cambiar panels
2. ❌ NO usar `useEffect` con `setPanel('edit')` a menos que sea necesario
3. ❌ NO hacer llamadas async/await directas en onSubmit
4. ❌ NO olvidar invalidar queries después de mutar
5. ❌ NO olvidar la prop `description` en ModalHeader
6. ❌ NO crear modales sin seguir este patrón exacto

---

## 🔑 PATRÓN PARA `created_by` - CRÍTICO

**SIEMPRE** usa este patrón para obtener el `created_by` (organization_member.id):

```typescript
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useCurrentUser } from '@/hooks/use-current-user'

// En el componente:
const { data: userData } = useCurrentUser()
const { data: members = [] } = useOrganizationMembers(organizationId)

// Al crear/actualizar registro:
const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
if (!currentMember) {
  throw new Error('No se encontró el miembro de la organización para el usuario actual')
}

const dataToInsert = {
  // ... otros campos
  created_by: currentMember.id, // ← ESTE es el valor correcto
}
```

### ❌ NUNCA uses estos patrones INCORRECTOS:

```typescript
// ❌ INCORRECTO - NO EXISTE el campo .id en userData.memberships
created_by: userData?.memberships?.find(m => m.organization_id === organizationId)?.id

// ❌ INCORRECTO - membership_id NO es el campo correcto
created_by: userData?.memberships?.find(m => m.organization_id === organizationId)?.membership_id

// ❌ INCORRECTO - userData.user.id es el user_id, NO el organization_member.id
created_by: userData?.user?.id
```

### ✅ Ejemplo completo (de SiteLogModal):

```typescript
export function MyModal({ modalData }: MyModalProps) {
  const { data: userData } = useCurrentUser()
  const { data: members = [] } = useOrganizationMembers(organizationId)

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Obtener el organization_member.id del usuario actual
      const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual')
      }

      const dataToInsert = {
        name: formData.name,
        organization_id: organizationId,
        created_by: currentMember.id, // ← organization_member.id correcto
      }

      return await createMyRecord(dataToInsert)
    },
  })
}
```

**Por qué este patrón:**
- `userData.memberships` NO contiene el campo `id` que necesitamos
- `useOrganizationMembers` devuelve los `organization_members` completos
- Buscamos el miembro por `user_id` para obtener su `organization_member.id`
- Este `id` es el que se guarda en `created_by`

---

## 🏗️ ARQUITECTURA: Dónde va la lógica de datos

**CRÍTICO:** Los modales NUNCA deben hacer queries directas de Supabase. Hay DOS opciones arquitectónicas:

### Opción A: Modales dentro de Features (PREFERIDO)

Si el modal es específico de un feature (sitelog, clients, movements, etc.):

1. **El modal va en**: `src/features/<feature>/modals/`
2. **La lógica de datos va en**: `src/features/<feature>/services/`
3. **Las mutations usan**: Services del feature

**Estructura:**
```
src/features/sitelog/
  services/
    createSiteLog.ts       ← Función async pura con query de Supabase
  modals/
    SiteLogModal.tsx       ← Modal que usa el service
```

**Ejemplo:**

```typescript
// features/sitelog/services/createSiteLog.ts
import { supabase } from '@/lib/supabase';

export async function createSiteLog(data: CreateSiteLogData) {
  const { error } = await supabase
    .from('site_logs')
    .insert({
      title: data.title,
      description: data.description,
      organization_id: data.organizationId,
      created_by: data.createdBy,
    });
  
  if (error) throw error;
}

// features/sitelog/modals/SiteLogModal.tsx
import { createSiteLog } from '../services/createSiteLog';
import { useMutation } from '@tanstack/react-query';

const createMutation = useMutation({
  mutationFn: (data: FormData) => createSiteLog({
    title: data.title,
    description: data.description,
    organizationId: userData.organization.id,
    createdBy: userData.user.id,
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['site-logs'] });
    toast({ title: 'Creado exitosamente' });
    handleClose();
  },
});
```

### Opción B: Modales Globales (Backend REST)

Si el modal es genérico/global (admin, auth, configuración):

1. **El modal va en**: `src/components/modal/modals/`
2. **La lógica de datos va en**: `server/` (backend Express)
3. **Las mutations usan**: `apiRequest` a endpoints REST

**Ejemplo:**

```typescript
// src/components/modal/modals/admin/AnnouncementFormModal.tsx
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

const createMutation = useMutation({
  mutationFn: async (data: FormData) => {
    return await apiRequest('POST', '/api/admin/announcements', {
      title: data.title,
      description: data.description,
      organization_id: userData.organization.id,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
    toast({ title: 'Anuncio creado' });
    handleClose();
  },
});
```

### ❌ LO QUE NUNCA DEBES HACER

```typescript
// ❌ INCORRECTO - Query directa de Supabase en modal
const createMutation = useMutation({
  mutationFn: async (data: FormData) => {
    const { error } = await supabase  // ❌ MAL
      .from('my_table')
      .insert({...});
  },
});
```

### ✅ Reglas de decisión:

- **¿Es específico de un feature?** → Opción A (service en feature)
- **¿Es global/admin/auth?** → Opción B (REST endpoint)
- **¿En duda?** → Opción A (siempre preferir features)

---

## ⚠️ REGLA CRÍTICA: isEditing en ModalLayout

**SIEMPRE** que uses `ModalLayout` para un modal de formulario CRUD (crear/editar), DEBES incluir `isEditing={true}`.

### ❌ ERROR COMÚN - Modal vacío:

```typescript
return (
  <ModalLayout
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
  <ModalLayout
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

`ModalLayout` tiene dos modos:
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
    <ModalHeader 
      title={isEditing ? 'Editar' : 'Nuevo'}
      description="Descripción"
      icon={MiIcono}
    />
  );

  const footerContent = (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isLoading}
    />
  );

  return (
    <ModalLayout
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

### 🏆 EJEMPLO PERFECTO - GOLD STANDARD:

**`src/features/sitelog/modals/SiteLogModal.tsx`** ← **ESTE ES EL MODAL PERFECTO**

**¿Por qué es el ejemplo perfecto?**

✅ **Arquitectura 100% correcta:**
- ✅ NO tiene queries directas de Supabase
- ✅ USA hooks desde el feature (`useSiteLogTypes`, `useProjectPersonnel`, `useSiteLogFiles`)
- ✅ Los hooks consumen services con JSDoc completo
- ✅ Caching optimizado con `staleTime` (2-5 min) y `gcTime` (5-10 min)
- ✅ Invalidación de cache correcta con queryKeys alineados

✅ **Seguridad multi-tenant:**
- ✅ Todos los services filtran por `organization_id`
- ✅ Previene data leaks cross-organization

✅ **Rendimiento:**
- ✅ Queries compartidas entre componentes via React Query
- ✅ Sin tráfico de red duplicado
- ✅ Sub-segundo de carga gracias a caching

✅ **Separación de responsabilidades:**
- ✅ Modal solo orquesta UI y validaciones
- ✅ Services contienen toda la lógica de Supabase
- ✅ Hooks manejan React Query
- ✅ Mappers transforman datos (si aplica)

**Este modal debe ser tu referencia #1 al crear cualquier modal nuevo en features.**

---

### Otros ejemplos correctos (globales/admin):
- `src/components/modal/modals/admin/AnnouncementFormModal.tsx`
- `src/components/modal/modals/admin/PaymentFormModal.tsx`
- `src/components/modal/modals/admin/PlanFormModal.tsx`
- `src/components/modal/modals/admin/PlanPriceFormModal.tsx`

---

## 📋 Patrón Completo de Modal (Copy-Paste Template)

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconName } from 'lucide-react'; // Cambiar IconName por el ícono apropiado
import { ModalHeader } from '../../form/ModalHeader';
import { ModalFooter } from '../../form/ModalFooter';
import { ModalLayout } from '../../form/ModalLayout';
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

  // 7. MUTATION - OPCIÓN A: Usando service (PREFERIDO para features)
  // Si el modal está en features/<feature>/modals/
  import { createEntity, updateEntity } from '../services'; // importar desde service
  
  const createMutation = useMutation({
    mutationFn: (data: MyFormData) => createEntity({
      title: data.title,
      description: data.description,
      organizationId: userData.organization.id,
      createdBy: userData.user.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
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

  const updateMutation = useMutation({
    mutationFn: (data: MyFormData) => updateEntity(entity!.id, {
      title: data.title,
      description: data.description,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
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

  // 8. MUTATION - OPCIÓN B: Usando REST endpoint (para modales globales/admin)
  // Si el modal está en src/components/modal/modals/
  import { apiRequest } from '@/lib/queryClient';
  
  const createMutation = useMutation({
    mutationFn: async (data: MyFormData) => {
      return await apiRequest('POST', '/api/entities', {
        title: data.title,
        description: data.description,
        organization_id: userData.organization.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
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

  const updateMutation = useMutation({
    mutationFn: async (data: MyFormData) => {
      return await apiRequest('PUT', `/api/entities/${entity!.id}`, {
        title: data.title,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
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

  // ❌ OPCIÓN C (DEPRECATED): Query directa de Supabase en modal - NO USAR
  // const createMutation = useMutation({
  //   mutationFn: async (data: MyFormData) => {
  //     const { error } = await supabase.from('my_table').insert({...}); // ❌ MAL
  //   }
  // });

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
    <ModalHeader 
      title={entity ? 'Editar Elemento' : 'Nuevo Elemento'}
      description={entity ? 'Actualiza la información del elemento' : 'Crea un nuevo elemento en el sistema'}
      icon={IconName}
    />
  );

  // 12. FOOTER CON BOTONES
  const footerContent = (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={entity ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  // 13. LAYOUT FINAL
  return (
    <ModalLayout
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

**Arquitectura (CRÍTICO):**
- [ ] ✅ Si es modal dentro de feature → USA hooks desde feature (NO queries directas de Supabase)
- [ ] ✅ Si es modal global/admin → USA REST endpoints con `apiRequest`
- [ ] ✅ NUNCA usa queries directas `supabase.from().select()` dentro del modal

**Estructura:**
- [ ] ✅ Usa `ModalLayout`, `ModalHeader`, `ModalFooter`
- [ ] ✅ ModalHeader tiene `title`, `description` e `icon`
- [ ] ✅ Usa `useForm` con `zodResolver`
- [ ] ✅ Props correctas: `modalData` y `onClose`

**Lógica de datos:**
- [ ] ✅ Usa `useMutation` (NO async/await directo)
- [ ] ✅ Invalida queries con `queryClient.invalidateQueries()` usando queryKeys correctos
- [ ] ✅ Muestra toast de éxito y error
- [ ] ✅ Manejo de isLoading durante submit

**UX:**
- [ ] ✅ Reset del form en handleClose
- [ ] ✅ useEffect para cargar datos si es edición
- [ ] ✅ Campos con FormField, FormLabel, FormControl, FormMessage

---

## 📚 Ejemplos de Referencia

Buenos ejemplos a seguir en el proyecto:

**🏆 GOLD STANDARD - Modal perfecto dentro de feature:**
- **`src/features/sitelog/modals/SiteLogModal.tsx`** ← **USAR ESTE COMO REFERENCIA #1**
  - ✅ Arquitectura perfecta: usa hooks desde feature, NO queries directas
  - ✅ Caching optimizado con React Query
  - ✅ Seguridad multi-tenant con filtros organization_id
  - ✅ Separación de responsabilidades (modal → hooks → services)

**Form Modals globales/admin (con formularios tradicionales):**
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
5. **DEBEN forzar panel 'edit'** - Usar `isEditing={true}` en ModalLayout

### Template de Selection Modal:

```typescript
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ModalHeader } from '../../form/ModalHeader';
import { ModalFooter } from '../../form/ModalFooter';
import { ModalLayout } from '../../form/ModalLayout';
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
    <ModalHeader
      title="Seleccionar Item"
      description="Selecciona un item de la lista para agregarlo"
      icon={IconName}
    />
  );

  const footerContent = (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      showLoadingSpinner={isLoading}
    />
  );

  return (
    <ModalLayout
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
- [ ] ✅ `ModalLayout` tiene `isEditing={true}`
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

## 🔑 Obtener organization_member_id para created_by

Cuando necesites el `created_by` field (organization_member_id):

```typescript
// Query para obtener organization_member_id del usuario actual
const { data: organizationMember } = useQuery<any>({
  queryKey: ['organization-member', organizationId, userId],
  queryFn: async () => {
    if (!supabase || !organizationId || !userId) return null;
    
    const { data, error } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching organization member:', error);
      return null;
    }
    
    return data;
  },
  enabled: !!organizationId && !!userId && !isEditing,
});

// Luego usa en tu mutation:
const organizationMemberId = organizationMember?.id;

const createMutation = useMutation({
  mutationFn: async (data: FormData) => {
    return await apiRequest('POST', '/api/endpoint', {
      ...data,
      created_by: organizationMemberId || null,
    });
  },
  // ...
});
```

**Referencias:**
- `src/components/modal/modals/construction/ProjectClientModal.tsx` (líneas 55-77, 150-154)
- `src/components/modal/modals/finances/movements/MovementImportStepModal.tsx` (línea 939)

---

## ⚠️ Errores Comunes a Evitar

1. **Olvidar la descripción en ModalHeader**
   - ❌ `<ModalHeader title="Título" icon={Icon} />`
   - ✅ `<ModalHeader title="Título" description="Descripción clara" icon={Icon} />`

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
9. Retornar ModalLayout con todo conectado
10. Probar crear, editar y cerrar

---

## 🎛️ MODALES CON SUBFORMS (Multi-Panel Modals)

### 📌 ¿Qué son los Subforms?

Los **subforms** son paneles secundarios dentro de un modal que permiten editar datos relacionados de forma aislada. Son ideales para:

- **Listas complejas** que requieren su propia UI (Personal, Maquinaria, Eventos)
- **Uploads de archivos** con drag & drop y preview
- **Formularios anidados** que no caben bien en el panel principal

**Ejemplo:** Modal de Bitácora con subforms de "Fotos y Videos", "Personal", "Eventos", "Maquinaria"

---

### 🎯 Cuándo usar Subforms

✅ **Usa subforms cuando:**
- Necesitas gestionar **listas de items** (agregar/editar/eliminar múltiples elementos)
- El subform tiene **su propia UI compleja** (tabla, galería, drag & drop)
- Quieres **separar visualmente** secciones del formulario principal
- Los datos del subform se guardan en **estado local** hasta el submit final

❌ **NO uses subforms cuando:**
- Solo tienes 2-3 campos simples (usa el panel principal)
- Los datos deben guardarse inmediatamente (usa modal separado)

---

### ⚡ Funcionalidad AUTOMÁTICA de ModalLayout

`ModalLayout` **automáticamente maneja** la navegación de subforms sin código adicional:

#### 1️⃣ **Auto-Back Button en Headers**

Cuando `currentPanel === 'subform'`, ModalLayout:
- ✅ Detecta automáticamente que estás en un subform
- ✅ Inyecta `showBackButton={true}` al header
- ✅ Inyecta `onBackClick={() => setPanel('edit')}` para volver al panel principal

**NO necesitas agregar esto manualmente:**
```typescript
// ❌ CÓDIGO VIEJO (ya no necesario)
<ModalHeader
  title="Fotos y Videos"
  showBackButton={true}              // ← ModalLayout lo agrega automáticamente
  onBackClick={() => setPanel('edit')} // ← ModalLayout lo agrega automáticamente
/>

// ✅ CÓDIGO NUEVO (más limpio)
<ModalHeader
  title="Fotos y Videos"
  description="Adjunta archivos multimedia"
  icon={Camera}
  // ← El botón de volver se agrega AUTOMÁTICAMENTE
/>
```

#### 2️⃣ **Auto-Navigation en Footer Buttons**

Cuando `currentPanel === 'subform'`, ModalLayout:
- ✅ Sobrescribe `onLeftClick` (Cancelar) → Vuelve a `edit` en lugar de cerrar modal
- ✅ Envuelve `onRightClick` (Submit) → Ejecuta acción original + Vuelve a `edit`

**Comportamiento automático:**

| Botón | Usuario hace click | Lo que pasa automáticamente |
|-------|-------------------|----------------------------|
| **Cancelar** | Click en "Cancelar" | ✅ Vuelve al panel `edit` (NO cierra modal) |
| **Guardar** | Click en "Guardar" | ✅ Ejecuta la acción + Vuelve a `edit` |

**Flujo de usuario mejorado:**
```
1. Abrir modal Bitácora
2. Click "Fotos" → Subir 3 imágenes → Click "Guardar"
   └─ ✅ Vuelve al form principal (datos en estado local)
   
3. Click "Personal" → Agregar 5 personas → Click "Guardar"
   └─ ✅ Vuelve al form principal (datos en estado local)
   
4. Revisar campos principales → Click "Crear"
   └─ ✅ Guarda TODO a la BD (bitácora + fotos + personal)
   └─ ✅ Modal se cierra
```

---

### 🏗️ Estructura de Modal con Subforms

**Archivo de referencia:** `src/features/sitelog/modals/SiteLogModal.tsx` ← **GOLD STANDARD**

#### Paso 1: Configurar panel store

```typescript
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore';

export function MiModal({ modalData, onClose }: MiModalProps) {
  const { currentPanel, currentSubform, setPanel, setSubform } = useModalPanelStore();
  
  // Estado local para datos de subforms
  const [filesToUpload, setFilesToUpload] = useState<FileInput[]>([]);
  const [personnelItems, setPersonnelItems] = useState<PersonnelItem[]>([]);
  // ...
}
```

#### Paso 2: Crear paneles de subforms

```typescript
// Subform de Fotos y Videos
const mediaSubform = (
  <MediaForm
    filesToUpload={filesToUpload}
    setFilesToUpload={setFilesToUpload}
    siteLogFiles={existingFiles}
  />
);

// Subform de Personal
const personnelSubform = (
  <PersonnelForm
    personnelItems={personnelItems}
    setPersonnelItems={setPersonnelItems}
    projectPersonnel={projectPersonnel}
  />
);
```

#### Paso 3: Configurar botones en panel principal

```typescript
const editPanel = (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Campos normales del formulario */}
      <FormField name="title" /* ... */ />
      
      {/* Botones para abrir subforms */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSubform('files');
            setPanel('subform');
          }}
          className="w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          Fotos y Videos ({filesToUpload.length})
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSubform('personal');
            setPanel('subform');
          }}
          className="w-full"
        >
          <Users className="mr-2 h-4 w-4" />
          Personal ({personnelItems.length})
        </Button>
      </div>
    </form>
  </Form>
);
```

#### Paso 4: Configurar headers dinámicos

```typescript
const getHeaderConfig = () => {
  if (currentPanel === 'subform') {
    const subformHeaders: Record<string, { icon: any; title: string; description: string }> = {
      'files': {
        icon: Camera,
        title: 'Fotos y Videos',
        description: 'Adjunta archivos multimedia al registro'
      },
      'personal': {
        icon: Users,
        title: 'Personal',
        description: 'Control de asistencia y personal'
      }
    };

    const config = subformHeaders[currentSubform || ''];
    if (!config) return null;

    // NO agregues showBackButton ni onBackClick - ModalLayout lo hace automáticamente
    return (
      <ModalHeader
        icon={config.icon}
        title={config.title}
        description={config.description}
      />
    );
  }

  // Header por defecto para edit
  return (
    <ModalHeader
      icon={FileText}
      title="Nueva Bitácora"
      description="Crear una nueva entrada en la bitácora"
    />
  );
};
```

#### Paso 5: Configurar footer dinámico

```typescript
const getFooterConfig = () => {
  if (currentPanel === 'subform') {
    // ModalLayout maneja automáticamente la navegación
    // Solo define los textos y acciones de datos
    return {
      cancelText: "Cancelar",
      onLeftClick: closeModal, // ← ModalLayout lo convertirá a setPanel('edit')
      submitText: "Guardar",
      onSubmit: () => {}, // ← Datos ya están en estado, ModalLayout vuelve a edit
      showLoadingSpinner: false
    };
  }

  // Footer para panel principal (submit real a BD)
  return {
    cancelText: "Cancelar",
    onLeftClick: closeModal,
    submitText: "Crear",
    onSubmit: handleSubmit,
    showLoadingSpinner: isLoading
  };
};

const footerConfig = getFooterConfig();
```

#### Paso 6: Layout final con subformPanel

```typescript
return (
  <ModalLayout 
    onClose={closeModal}
    columns={1}
    viewPanel={viewPanel}
    editPanel={editPanel}
    subformPanel={
      currentSubform === 'files' ? mediaSubform :
      currentSubform === 'personal' ? personnelSubform :
      null
    }
    headerContent={getHeaderConfig()}
    footerContent={
      <ModalFooter
        cancelText={footerConfig.cancelText}
        onLeftClick={footerConfig.onLeftClick}
        onSubmit={footerConfig.onSubmit}
        submitText={footerConfig.submitText}
        showLoadingSpinner={footerConfig.showLoadingSpinner}
      />
    }
    isEditing={false}
  />
);
```

---

### 📸 UploadMediaField - Component para Subforms de Archivos

Para subforms que manejan uploads de archivos, usa el componente **`UploadMediaField`**:

**Ubicación:** `src/components/ui-custom/fields/UploadMediaField.tsx`

**Features:**
- ✅ **Drag & Drop area SIEMPRE visible** (no desaparece cuando hay archivos)
- ✅ **Lista vertical de cards** con thumbnail, nombre, peso, progreso
- ✅ **Barra de progreso** con porcentaje durante upload
- ✅ **Image Lightbox** para preview de imágenes
- ✅ **Validación** de tipos y tamaños de archivos
- ✅ **Badge "Nuevo"** para archivos recién subidos

**Uso en subform:**

```typescript
import { UploadMediaField } from '@/components/ui-custom/fields/UploadMediaField';

export function MediaForm({ filesToUpload, setFilesToUpload, siteLogFiles }: Props) {
  const handleExistingFileDelete = async (fileId: string) => {
    // Lógica de eliminación
  };

  return (
    <UploadMediaField
      existingFiles={siteLogFiles}
      filesToUpload={filesToUpload}
      onFilesChange={setFilesToUpload}
      onExistingFileDelete={handleExistingFileDelete}
      emptyStateTitle="No hay archivos adjuntos"
      emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
      uploadButtonText="Subir Archivos"
      newFileBadgeText="Nuevo"
      maxSize={50 * 1024 * 1024} // 50MB
      acceptedTypes={{
        'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
        'video/*': ['.mp4', '.mov', '.avi', '.mkv']
      }}
    />
  );
}
```

**Layout visual:**

```
┌─────────────────────────────────────┐
│          📤                          │ ← Drag & Drop (SIEMPRE visible)
│   Arrastra archivos o haz clic...   │
│   Tamaño máximo: 50 MB              │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🖼️  photo1.jpg       [NUEVO]   🗑️   │ ← Card vertical
│     2.5 MB • Completado              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🖼️  photo2.jpg              [×]      │
│     1.2 MB / 3.5 MB • 34%           │
│     ▓▓▓▓▓░░░░░░░░░░                 │ ← Progress bar
└──────────────────────────────────────┘
```

**Props principales:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `existingFiles` | `any[]` | Archivos ya guardados en BD |
| `filesToUpload` | `any[]` | Archivos nuevos en estado local |
| `onFilesChange` | `(files) => void` | Callback cuando cambian archivos |
| `onExistingFileDelete` | `(id) => Promise<void>` | Handler para eliminar archivos existentes |
| `maxSize` | `number` | Tamaño máximo en bytes (default: 50MB) |
| `acceptedTypes` | `Record<string, string[]>` | Tipos de archivos aceptados |

---

### ✅ Checklist para Modales con Subforms

**Configuración:**
- [ ] ✅ Usa `useModalPanelStore` para manejar `currentPanel` y `currentSubform`
- [ ] ✅ Estado local para datos de cada subform (arrays, objects, etc.)
- [ ] ✅ Botones en `editPanel` para abrir subforms con `setSubform()` y `setPanel('subform')`

**Headers dinámicos:**
- [ ] ✅ Función `getHeaderConfig()` que retorna headers según `currentPanel`
- [ ] ✅ Headers de subforms **NO incluyen** `showBackButton` ni `onBackClick` (automático)
- [ ] ✅ Cada subform tiene su propio `icon`, `title` y `description`

**Footer dinámico:**
- [ ] ✅ Función `getFooterConfig()` que retorna config según `currentPanel`
- [ ] ✅ Footer de subforms solo define textos y acciones de datos (navegación es automática)
- [ ] ✅ Footer del panel principal maneja submit real a BD

**Layout:**
- [ ] ✅ `ModalLayout` recibe prop `subformPanel` con lógica condicional
- [ ] ✅ Cada subform se mapea correctamente según `currentSubform`

**UX Automática (verificar que funcione):**
- [ ] ✅ Botón "Volver" aparece automáticamente en headers de subforms
- [ ] ✅ Click en "Cancelar" en subform → Vuelve a `edit` (NO cierra modal)
- [ ] ✅ Click en "Guardar" en subform → Ejecuta acción + Vuelve a `edit`
- [ ] ✅ Los datos se mantienen en estado local hasta el submit final

---

### 🏆 Ejemplo Completo de Referencia

**GOLD STANDARD:** `src/features/sitelog/modals/SiteLogModal.tsx`

Este modal tiene:
- ✅ 4 subforms (Personal, Fotos, Eventos, Maquinaria)
- ✅ Headers y footers dinámicos correctamente configurados
- ✅ Navegación automática funcionando perfectamente
- ✅ Estado local para cada subform
- ✅ Submit final que guarda TODO a la BD

**Otros modales con subforms:**
- `src/components/modal/modals/resources/contacts/ContactModal.tsx` (1 subform: Attachments)
- `src/components/modal/modals/construction/tasks/TaskMultiModal.tsx` (2 subforms: Parametric-task, Custom)

---

### 🚫 Errores Comunes con Subforms

1. **Agregar `showBackButton` manualmente en headers de subforms**
   - ❌ `<ModalHeader showBackButton={true} onBackClick={...} />`
   - ✅ Omitir estas props - ModalLayout las inyecta automáticamente

2. **Cerrar el modal al hacer submit en subform**
   - ❌ `onSubmit: closeModal` en footer de subform
   - ✅ `onSubmit: () => {}` - ModalLayout maneja la navegación

3. **No usar estado local para datos de subforms**
   - ❌ Guardar a BD inmediatamente al cambiar subform
   - ✅ Guardar en estado (`useState`) hasta submit final

4. **Olvidar mapear `currentSubform` en `subformPanel`**
   - ❌ `subformPanel={mediaSubform}` (siempre el mismo)
   - ✅ `subformPanel={currentSubform === 'files' ? mediaSubform : ...}`

5. **No invalidar queries después del submit final**
   - ❌ Solo cerrar modal sin invalidar
   - ✅ `queryClient.invalidateQueries()` antes de cerrar

---

**Última actualización**: Noviembre 17, 2025
