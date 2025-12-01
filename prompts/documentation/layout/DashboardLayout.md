# DashboardLayout - Documentación

## Descripción General
`DashboardLayout` es el layout principal para todas las páginas autenticadas de la aplicación. Proporciona una estructura consistente con sidebar, header, y área de contenido.

## Ubicación
`src/layouts/dashboard/DashboardLayout.tsx`

## Props

### `headerProps`
Objeto que configura el header de la página.

```typescript
interface HeaderProps {
  icon?: React.ComponentType<any>;          // Icono del header
  title?: string;                            // Título principal
  description?: string;                      // Descripción secundaria
  pageTitle?: string;                        // Título de la página (para SEO)
  organizationId?: string;                   // ID de organización para mostrar miembros
  showMembers?: boolean;                     // Mostrar avatares de miembros
  showProjectSelector?: boolean;             // Mostrar selector de proyecto
  tabs?: Tab[];                              // Tabs de navegación
  onTabChange?: (tabId: string) => void;    // Callback cuando cambia la tab
  
  // ⭐ ACCIONES DEL HEADER (ver sección detallada abajo)
  actionButton?: ActionButtonConfig;         // Botón de acción único (RECOMENDADO)
  actions?: React.ReactNode[];               // Array de componentes React
}
```

---

## ⚠️ ACCIONES DEL HEADER - IMPORTANTE

### Opción 1: `actionButton` (RECOMENDADO para acción única)
Usar cuando necesitas UN solo botón de acción. Es declarativo y el Layout se encarga del renderizado.

```typescript
const headerProps = {
  // ... otras props
  actionButton: {
    label: "Ver Planes",
    icon: Sparkles,  // Componente de lucide-react
    onClick: () => navigate('/settings/pricing-plan')
  }
};
```

**Ventajas:**
- Declarativo (solo pasás datos, no componentes)
- El Layout maneja estilos consistentes
- Soporta `additionalButton` para un segundo botón

### Opción 2: `actions` (Para múltiples acciones o componentes complejos)
Usar cuando necesitas MÚLTIPLES botones o componentes complejos como `PlanRestricted`.

```typescript
const headerProps = {
  // ... otras props
  actions: [
    <PlanRestricted key="create" feature="max_projects" current={count}>
      <Button onClick={() => openModal('project', {})}>
        <Plus className="w-4 h-4 mr-1" />
        Nuevo Proyecto
      </Button>
    </PlanRestricted>
  ]
};
```

---

## ❌ NO HACER - Errores comunes

### No hardcodear botones inline en el render
```typescript
// ❌ MAL - No hacer esto
return (
  <Layout headerProps={headerProps}>
    <div className="flex justify-end">
      <Button onClick={...}>Ver Planes</Button>  {/* NO! */}
    </div>
    {children}
  </Layout>
);
```

### No importar Button innecesariamente cuando usas actionButton
```typescript
// ❌ MAL - No necesitas Button si usas actionButton
import { Button } from '@/components/ui/button';

const headerProps = {
  actionButton: { ... }  // El Layout crea el Button internamente
};
```

---

## Ejemplos de Uso Real

### Billing.tsx - Acción única simple
```typescript
import { CreditCard, Sparkles } from 'lucide-react';

const headerProps = {
  icon: CreditCard,
  title: "Facturación",
  description: "Gestiona tu plan de suscripción...",
  actionButton: {
    label: "Ver Planes",
    icon: Sparkles,
    onClick: () => navigate('/settings/pricing-plan')
  }
};
```

### Projects.tsx - Múltiples acciones con restricciones
```typescript
const getActions = () => [
  <PlanRestricted key="create" feature="max_projects" current={count}>
    <Button onClick={() => openModal('project', {})}>
      <Plus className="w-4 h-4 mr-1" />
      Nuevo Proyecto
    </Button>
  </PlanRestricted>
];

const headerProps = {
  // ...
  actions: getActions()
};
```

### Members.tsx - Similar a Projects con restricciones de plan
```typescript
const headerProps = {
  // ...
  actions: [
    <PlanRestricted key="invite" feature="max_members" current={membersCount}>
      <Button onClick={() => openModal('invite-member', {})}>
        <UserPlus className="w-4 h-4 mr-1" />
        Invitar Miembro
      </Button>
    </PlanRestricted>
  ]
};
```

---

## Flujo de Datos

```
Page Component
      ↓
headerProps.actionButton / headerProps.actions
      ↓
DashboardLayout
      ↓
PageLayout (recibe actions y actionButton)
      ↓
Header Component (renderiza los botones)
```

---

## Reglas de Decisión

| Caso | Usar |
|------|------|
| Un botón simple | `actionButton` |
| Múltiples botones | `actions` |
| Botón con PlanRestricted | `actions` |
| Botón condicional por tab | `actions` con función |
| Sin acciones en header | No pasar ninguno |
