# UI Primitives (Nivel 0)

## ¿Qué son los UI Primitives?

Los UI Primitives son **componentes atómicos y visuales** que forman la base del sistema de diseño:
- Card, Button, Badge, Avatar, Input, etc.
- Son los bloques de construcción más básicos
- Provienen principalmente de shadcn/ui

## Responsabilidades

| SÍ hace | NO hace |
|---------|---------|
| Renderizar elementos visuales básicos | Contener lógica de negocio |
| Manejar variantes y estados (hover, focus, disabled) | Consultar datos |
| Aplicar tokens de diseño (colores, espaciado) | Conocer el dominio |
| Exponer APIs consistentes | Manejar layout de página |

## Por qué nunca deben contener lógica de negocio

1. **Reutilización**: Un Button debe funcionar igual en cualquier contexto
2. **Mantenibilidad**: Cambios de negocio no deben afectar componentes base
3. **Testing**: Los primitivos son fáciles de testear aisladamente
4. **Consistencia**: El mismo Button en toda la aplicación

## Cuándo modificar esta carpeta

Modificar componentes en `/ui` cuando quieras cambiar la **estética global**:
- Cambiar colores primarios/secundarios
- Ajustar border-radius de todos los buttons
- Modificar tipografía base
- Actualizar espaciados estándar

## ⚠️ REGLAS ESTRICTAS

1. **NO agregar lógica de negocio** a estos componentes
2. **NO importar hooks de datos** (useQuery, etc.)
3. **NO conocer dominios** (proyectos, gastos, usuarios)
4. **NO hacer fetch de datos**

## Relación con otros niveles

```
Nivel 2 (Dashboard) ───┐
                       ├──usa──▶ Nivel 0 (UI Primitives)
Nivel 1 (Charts) ──────┘
```

Los niveles superiores consumen estos primitivos para construir componentes más complejos.

## Ejemplos de componentes

| Componente | Descripción |
|------------|-------------|
| `Button` | Botón con variantes |
| `Card` | Contenedor con superficie |
| `Badge` | Etiqueta pequeña |
| `Input` | Campo de entrada |
| `Avatar` | Imagen de usuario |
| `Dialog` | Modal |
| `Tooltip` | Información emergente |
