# Cosas a tener en cuenta cuando te de PROMPTS de GPT u otras IAs:

## 📋 Reglas Generales

Las IAs:

1. Normalmente no están tan actualizadas como tu, y pueden suponer cosas erroneas, coo cosas que aún no hicimos y si hicimos, etc. Por favor, ten en cuenta eso antes de actuar.
2. Pueden olvidarse o estar desactualizadas con los nombres de los archivos ya creados, por favor, revisa tu que nada de lo que te pida ya exista (incluso con otro nombre) asi no tenemos archivos duplicados.
3. Puede que te de lógicas que ya tenemos. Intenta revisar todos los archivos relacionados a lo que te pide y, en el caso de necesitar hacer nuevos, hazlos. En el caso de poder MEJORAR, OPTIMIZAR o IMPLEMENTAR NUEVAS LOGICAS a archivos existentes, hazlo.
4. Siempre que una IA te de codigos SQLs o te pida modificar cosas en SUPABSE, recuerda que ese PROMPT normmalmente me lo da a mi. Yo soy quien EJECUTA lo que necesitamos en SUPABASE y no tu. Solo tenlo en cuenta como que yo ya lo hice, y su tienes alguna duda o crees que algo esta mal, dimelo.
5. Siempre ANALIZA primer el prompt, ANALIZA lo que ya tenemos, ANALIZA si esto es razonable para nuestra estructura, PREGUNTAME si necesitas saber algo o tomar una decisión, y luego ejecutas.

Por favor, la idea es:

1. No tener archivos ni logicas duplicadas.
2. No romper nada de lo existente, sino MEJORARLO u OPTIMIZARLO.
3. Utilizar siempre las carpetas que ya tenemos,cuando haya que hacer MODALS, PAGINAS, ARCHIVOS etc, si es que ya hay carpetas con ese fin. En el caso de que todavia no hayan carpetas con esas logicas (porque quiza esa nueva funcionalidad aun no existe) entonces hazlo y dime donde lo creaste.

---

## 🎨 Prompts Recibidos de GPT

### Fase 2 — Propagación de Color Dinámico del Proyecto (Nov 2024)

**Contexto**: GPT sugirió mejoras para el sistema de colores dinámicos de proyecto.

#### 🔍 Análisis Técnico (Claude)

**Estado actual de implementación:**
- ✅ Ya tenemos: `src/hooks/use-project-accent-color.ts` - Hook que calcula colores dinámicos
- ✅ Ya tenemos: CSS variables inyectadas vía `style` prop en componentes
- ✅ Ya tenemos: Sistema de colores predefinidos + personalizados con slider HSL
- ✅ Ya tenemos: Gating por plan (PRO puede usar colores personalizados)

**Archivos clave existentes:**
- `src/hooks/use-project-accent-color.ts` - Hook principal de colores
- `src/components/modal/modals/organizations/ProjectModal.tsx` - Modal de creación/edición con color picker
- `src/components/ui-custom/general/StatCard.tsx` - Componente que usa colores dinámicos
- `src/index.css` - CSS variables globales

**NO necesitamos crear:**
- ❌ `themePreviewStore.ts` - Ya usamos el hook `useProjectAccentColor` directamente
- ❌ Layout wrapper especial - Ya inyectamos colores en cada componente que lo necesita

**Consideraciones técnicas:**
1. **Arquitectura actual**: Preferimos inyectar colores a nivel componente (más granular) vs global layout
2. **Performance**: Ya usamos `chroma-js` para cálculos, no necesitamos más overhead
3. **Compatibilidad dark mode**: Ya manejado por el hook con variantes específicas
4. **CSS transitions**: Ya implementadas en componentes (StatCard, etc.)

**Si implementamos sugerencias de GPT, debemos:**
- [ ] Evaluar si queremos propagación global vs actual sistema granular
- [ ] Verificar que no duplicamos lógica del hook `useProjectAccentColor`
- [ ] Mantener compatibilidad con dark/light mode existente
- [ ] Probar performance con muchos componentes renderizados

#### 📝 Prompt Original de GPT

```
🎨 Fase 2 — Propagación de color del proyecto con animación visual

Objetivo:
- Que al activar o cambiar el color personalizado, toda la página del proyecto adopte sutiles variaciones de esa tonalidad
- Sin afectar performance (transiciones solo CSS, no re-renders React)
- Manteniendo compatibilidad con el modo oscuro/claro

Sugerencias:
1. Actualizar store para soporte global de color activo
2. Inyectar color como CSS variables globales en Layout
3. Aplicar color al encabezado y badges
4. Propagar color a cards del dashboard
5. Conectar color activo desde backend
6. (Opcional) Efecto de transición de fondo animado
```

**Decisión**: Antes de implementar, revisar si nuestro sistema actual (hook + inyección granular) ya cumple estos objetivos o si necesitamos un enfoque más global.