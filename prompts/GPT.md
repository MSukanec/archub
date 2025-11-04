# Cosas a tener en cuenta cuando te de PROMPTS de GPT u otras IAs:

## 📋 Reglas Generales

Ten en cuenta que las IAs:

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

#### ✅ Estado: COMPLETADO

**Lo que implementamos:**
- ✅ Animaciones CSS mejoradas (700ms smooth transitions)
- ✅ Breathing effect para páginas de proyecto
- ✅ Accent glow en avatares y elementos clave
- ✅ Transiciones automáticas en StatCard
- ✅ Sistema de clases CSS reutilizables

**Archivos modificados:**
- `src/index.css` - Animaciones y efectos
- `src/components/ui/stat-card.tsx` - Transiciones mejoradas
- `src/pages/professional/project/dashboard/ProjectDashboard.tsx` - Breathing effect

---

### Fase 3 — Color Inteligente + Identidad Viva del Proyecto (Nov 2024)

**Contexto**: GPT propone 3 sub-etapas para llevar el sistema de colores al siguiente nivel.

#### 🔍 Análisis Técnico (Claude)

**YA TENEMOS implementado:**
- ✅ Sistema base de colores dinámicos (`useProjectAccentColor` hook)
- ✅ CSS variables que cambian automáticamente (`--accent`, `--accent-rgb`, `--accent-hover`, etc.)
- ✅ Cálculo automático de variantes usando `chroma-js`
- ✅ Transiciones suaves y animaciones
- ✅ Aplicación en algunos componentes (StatCard, ProjectDashboard, avatares)

**NO hemos implementado aún:**

#### 📦 3.1 — Aplicación Visual Automática (INTERESANTE ⭐⭐⭐)

**¿Qué propone GPT?**
- Aplicar variables CSS automáticamente a TODOS los componentes de la app
- Botones, badges, cards, estados hover, bordes activos, etc.
- Usar utilidades de Tailwind: `className="text-[var(--accent)]"`

**Mi análisis:**
- ✅ **MUY ÚTIL** - Expandiría el sistema a toda la app de forma consistente
- ✅ **BAJO RIESGO** - Solo agregar clases CSS, no cambia lógica
- ✅ **ALTO IMPACTO VISUAL** - Toda la UI "respira" el color del proyecto
- ⚠️ **CONSIDERACIÓN**: Necesitamos auditar qué componentes NO deberían cambiar (ej: sidebar general, admin, etc.)

**Componentes a actualizar:**
- Botones primarios/secundarios cuando están en contexto de proyecto
- Badges de estado
- Cards y paneles
- Indicadores de progreso
- Iconos de acciones
- Bordes activos en inputs

#### 🌈 3.2 — Gradiente Vivo y "Estado Emocional" (CREATIVO ⭐⭐)

**¿Qué propone GPT?**
- Color cambia según el estado del proyecto (progreso, carga de tareas, etc.)
- Interpolación entre `hue_base` y `hue_estado`
- Si el proyecto está estancado → color más frío (azulado)
- Si tiene mucho avance → color más cálido (coral, naranja)

**Mi análisis:**
- 🤔 **INTERESANTE** - Concepto innovador
- ⚠️ **COMPLEJIDAD MEDIA** - Necesitamos métricas del proyecto (% avance, tareas completadas, etc.)
- ⚠️ **RIESGO DE UX** - Podría confundir si no se explica bien al usuario
- 💡 **ALTERNATIVA**: Podría ser una configuración opcional, no automática

**Consideraciones:**
- ¿Qué métricas usaríamos para determinar el "estado emocional"?
- ¿Sería automático o el usuario podría ajustarlo manualmente?
- ¿Cómo evitamos que sea molesto si el proyecto está "estancado" mucho tiempo?

#### ✨ 3.3 — Identidad Visual del Proyecto (INTERESANTE ⭐⭐⭐)

**¿Qué propone GPT?**
- Generar paleta derivada automáticamente desde el color elegido
- `generatePaletteFromHue(hue)` → primary, accent, neutral, bg-light, bg-dark
- Aplicar en PDFs, encabezados, gráficas, vistas compartidas

**Mi análisis:**
- ✅ **MUY ÚTIL** - Branding automático por proyecto
- ✅ **ALTO VALOR** - PDFs y reportes con identidad visual propia
- ⚠️ **COMPLEJIDAD MEDIA** - Necesitamos generar PDFs (ya tenemos `@react-pdf/renderer`)
- 💡 **YA TENEMOS**: Parte de esto con `chroma-js` (calculamos hover, foreground, etc.)

**Lo que falta:**
- Expandir la paleta generada (actualmente solo calculamos hover y foreground)
- Integración con sistema de PDFs/reportes
- Aplicar en gráficas (Recharts ya usa `--chart-1`, etc.)

---

### 🎯 Mi Recomendación Priorizada

**FASE A - Aplicación visual automática (Implementar YA)** ⭐⭐⭐
- Bajo riesgo, alto impacto
- Expande lo que ya tenemos
- Mejora consistencia visual

**FASE B - Identidad visual del proyecto (Implementar después)** ⭐⭐⭐
- Alto valor para usuarios PRO
- Preparar para exportación de reportes
- Complementa bien con FASE A

**FASE C - Estado emocional (Evaluar después)** ⭐⭐
- Concepto interesante pero complejo
- Requiere métricas del proyecto que quizás no tenemos
- Podría ser confuso si no se diseña bien la UX