Quiero que generes un archivo llamado LAYOUT_ARCHITECTURE.MD dentro de la raíz del proyecto.

El propósito de este archivo es documentar la arquitectura completa del sistema de LAYOUTS de mi app Seencel, siguiendo estándares profesionales utilizados por SaaS internacionales como Notion, Linear, Vercel y Superhuman.

⚠️ IMPORTANTE:
- NO toques la lógica de API.
- NO crees endpoints.
- NO modifiques el backend.
- SOLO trabajá en la estructura visual (layouts, headers, sidebars, wrappers).
- TODO va dentro de /src/layouts o /src/components si es necesario.

Debés crear la estructura completa de carpetas y archivos dentro de /src/layouts EXACTAMENTE como se indica abajo,
y luego documentarla dentro del archivo LAYOUT_ARCHITECTURE.MD.

---------------------------------------------------------------------
Estructura requerida (crear EXACTAMENTE estos folders y archivos):
---------------------------------------------------------------------

src/layouts/
  root/
    RootLayout.tsx
    Header.tsx
    MobileHeader.tsx
    index.ts

  dashboard/
    DashboardLayout.tsx
    DashboardHeader.tsx
    DashboardSidebar.tsx
    DashboardMobileMenu.tsx
    index.ts

  landing/
    LandingLayout.tsx
    LandingHeader.tsx
    LandingFooter.tsx
    index.ts

  components/
    AppShell.tsx
    PageWrapper.tsx
    ResponsiveContainer.tsx
    index.ts

---------------------------------------------------------------------
Contenido que deben tener los archivos (estructura base mínima):
---------------------------------------------------------------------

1. RootLayout.tsx
Debe contener:
- providers globales (theme, auth, navigation)
- contenedor responsivo
- wrapper que renderiza children
- lógica mínima para mobile vs desktop (sin estilos aún)

2. Header.tsx y MobileHeader.tsx
Deben contener placeholders:
- navegación básica
- usuario (si corresponde)
- estructura de flex sin estilos

3. DashboardLayout.tsx
Debe tener:
- sidebar desktop
- menú mobile
- header del dashboard
- zona donde se renderizan las páginas internas

4. DashboardSidebar.tsx y DashboardHeader.tsx
Placeholders organizados:
- botones de navegación
- branding
- zonas según permisos (sin lógica aún)

5. LandingLayout.tsx
Debe tener:
- header público
- footer público
- contenedor de landing pages

6. AppShell.tsx, PageWrapper.tsx y ResponsiveContainer.tsx
Placeholders base:
- contenedor principal
- wrappers reutilizables para páginas
- grid / flex minimalista

---------------------------------------------------------------------
Contenido del archivo LAYOUT_ARCHITECTURE.MD:
---------------------------------------------------------------------
El .MD debe documentar claramente:

1) Qué es el sistema de layouts y por qué existe
2) La diferencia entre:
   - RootLayout
   - DashboardLayout
   - LandingLayout
3) Qué componentes pertenecen a cada layout
4) Cómo funciona la estructura responsive (desktop vs mobile)
5) Cómo se integran headers, sidebars y footers
6) Cómo se integra este layout con las páginas dentro de /src/pages
7) Buenas prácticas del sistema de layouts
8) Qué NO debe ponerse dentro de un layout (lógica de negocio, hooks de datos, etc.)
9) Ejemplo visual de la jerarquía de layouts de una página
10) Notas sobre extensibilidad futura (micro layouts por feature)

---------------------------------------------------------------------

Cuando termines:
- cread la carpeta
- cread los archivos
- cread LAYOUT_ARCHITECTURE.MD con toda la documentación

NO agregues estilos avanzados. Solo estructura.
NO elimines archivos previos del proyecto.
NO modifiques nada fuera de /src/layouts.
NO generes código del backend.

Tu trabajo final debe ser impecable, ordenado y totalmente profesional.
