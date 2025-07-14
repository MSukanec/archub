# FormSubsectionButton Component

Un componente de botón especializado para formularios modales que permite navegar a subformularios con un diseño elegante y efectos hover.

## Características

- **Diseño moderno**: Botón con borde punteado que se activa con hover
- **Efectos interactivos**: Botón "+" aparece al hacer hover en el lado derecho
- **Icono personalizable**: Soporte para cualquier icono de Lucide React
- **Estados visuales**: Cambios de color en hover y focus
- **Accesible**: Soporte completo para teclado y lectores de pantalla
- **Responsive**: Adaptable a diferentes tamaños de pantalla

## Uso Básico

```tsx
import { FormSubsectionButton } from '@/components/modal/form';
import { Phone } from 'lucide-react';

function MyComponent() {
  const handleAddPhone = () => {
    // Navegar al subformulario de teléfono
    console.log('Navigating to phone subform...');
  };

  return (
    <FormSubsectionButton
      icon={<Phone />}
      title="Phone Number"
      description="Add phone number"
      onClick={handleAddPhone}
    />
  );
}
```

## Props

| Prop | Tipo | Descripción | Requerido |
|------|------|-------------|-----------|
| `icon` | `React.ReactNode` | Icono que se muestra en el botón | ✅ |
| `title` | `string` | Título principal del botón | ✅ |
| `description` | `string` | Descripción que aparece debajo del título | ✅ |
| `onClick` | `() => void` | Función que se ejecuta al hacer clic | ✅ |
| `className` | `string` | Clases CSS adicionales | ❌ |
| `disabled` | `boolean` | Si el botón está deshabilitado | ❌ |

## Ejemplos de Uso

### Ejemplo Simple
```tsx
<FormSubsectionButton
  icon={<Mail />}
  title="Email Address"
  description="Add email address"
  onClick={() => navigateToEmailForm()}
/>
```

### Ejemplo con Estado Deshabilitado
```tsx
<FormSubsectionButton
  icon={<Calendar />}
  title="Schedule"
  description="Add availability schedule"
  onClick={() => console.log('Schedule...')}
  disabled={true}
/>
```

### Ejemplo con Clases Personalizadas
```tsx
<FormSubsectionButton
  icon={<Building />}
  title="Company Information"
  description="Add company details"
  onClick={() => navigateToCompanyForm()}
  className="bg-accent/5 border-accent/20"
/>
```

## Integración con Formularios Modales

El componente está diseñado para trabajar con el sistema de formularios modales:

```tsx
import { FormModalLayout, FormSubsectionButton } from '@/components/modal/form';

function ContactModal() {
  return (
    <FormModalLayout>
      <div className="space-y-4">
        <FormSubsectionButton
          icon={<Phone />}
          title="Teléfono"
          description="Agregar número de teléfono"
          onClick={() => modalPanelStore.setActivePanel('phone')}
        />
        
        <FormSubsectionButton
          icon={<Mail />}
          title="Email"
          description="Agregar dirección de correo"
          onClick={() => modalPanelStore.setActivePanel('email')}
        />
      </div>
    </FormModalLayout>
  );
}
```

## Comportamiento Visual

1. **Estado Normal**: Borde punteado gris, icono en color muted
2. **Estado Hover**: 
   - Borde se vuelve accent color
   - Icono cambia a accent color
   - Título cambia a accent color
   - Aparece botón "+" en el lado derecho
3. **Estado Focus**: Ring de enfoque para accesibilidad
4. **Estado Disabled**: Opacidad reducida, no interactivo

## Estilos CSS

El componente utiliza las siguientes variables CSS:
- `--accent`: Color principal para estados activos
- `--border`: Color del borde por defecto
- `--muted-foreground`: Color del texto secundario
- `--background`: Color de fondo

## Accesibilidad

- Soporte completo para navegación por teclado
- Focus ring visible
- Texto alternativo para iconos
- Estados disabled apropiados
- Contraste de colores accesible