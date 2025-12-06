# Auditoría Completa del Sistema PDF - Seencel

**Fecha de Auditoría:** 6 de Diciembre 2025  
**Estado General:** INCOMPLETO - Requiere desarrollo de sistema unificado

---

## 1. RESUMEN EJECUTIVO

### Estado Actual
El sistema de PDFs en Seencel está **parcialmente implementado** con una estructura base en `src/features/pdf/` pero:
- **NO está integrado** con la mayoría de features de la plataforma
- **NO tiene tabla en schema.ts** (solo existe documentación de diseño)
- **NO hay endpoints backend** para templates o configuración
- **NO hay diferenciación** FREE vs PRO/TEAMS
- La implementación actual está enfocada únicamente en **presupuestos (budgets)**

### Componentes Existentes vs Faltantes

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Feature folder | ✅ Existe | `src/features/pdf/` |
| Componentes base | ✅ Existe | PdfDocument, PdfViewer, bloques |
| Modal exportador | ✅ Existe | PDFExporterModal.tsx |
| Tabla DB pdf_templates | ❌ NO EXISTE | Solo documentación en prompts/tables |
| Schema Drizzle | ❌ NO EXISTE | No hay definición en schema.ts |
| Endpoints backend | ❌ NO EXISTE | No hay API para templates |
| Sistema de plantillas | ❌ NO EXISTE | Hardcodeado para budgets |
| Restricción por plan | ❌ NO EXISTE | Sin PlanRestricted |
| Bitácora PDF | ❌ NO EXISTE | Solo vista web en portal |
| Comprobante cliente | ❌ NO EXISTE | Sin PDF para client payments |
| Recibo subcontrato | ❌ NO EXISTE | Sin PDF para pagos |
| Factura curso | ✅ EXISTE | InvoicePDF.tsx (suscripciones) |

---

## 2. INVENTARIO COMPLETO DE ARCHIVOS PDF

### 2.1 Feature Principal: `src/features/pdf/`

```
src/features/pdf/
├── components/
│   ├── blocks/
│   │   ├── PdfBudgetTable.tsx    # Tabla de items de presupuesto
│   │   ├── PdfFooter.tsx         # Footer con texto y divisor
│   │   └── PdfHeader.tsx         # Header con logo, info proyecto
│   ├── InvoicePDF.tsx            # Factura de suscripción Seencel
│   ├── PdfDocument.tsx           # Documento genérico con bloques
│   └── PdfViewer.tsx             # Visor de PDF en canvas
├── modals/
│   └── PDFExporterModal.tsx      # Modal de exportación (1132 líneas)
├── services/
│   └── pdfService.ts             # Registro de bloques disponibles
├── types/
│   └── types.ts                  # PdfBlock, PdfBlockProps
└── index.ts                      # Exports públicos
```

### 2.2 Uso en Otras Partes del Código

| Archivo | Uso | Completitud |
|---------|-----|-------------|
| `src/pages/billing/tabs/BillingListTab.tsx` | InvoicePDF para facturas suscripción | ✅ Completo |
| `src/features/client-portal/components/PaymentsList.tsx` | Solo muestra datos, NO genera PDF | ❌ Falta PDF |
| `src/features/client-portal/components/SiteLogsFeed.tsx` | Solo vista web, NO genera PDF | ❌ Falta PDF |
| `src/features/clients/forms/ClientPaymentForm.tsx` | Referencia pero sin implementar | ❌ Falta PDF |

---

## 3. ANÁLISIS DE BASE DE DATOS

### 3.1 Tabla Diseñada (NO IMPLEMENTADA)

Según `prompts/tables/tables-pdf.md`, existe un diseño para `pdf_templates`:

```typescript
// TABLA DISEÑADA PERO NO EXISTE EN schema.ts
pdf_templates: {
  id: uuid
  name: text
  
  // Logo
  logo_width: integer
  logo_height: integer
  
  // Company Info
  company_name_show: boolean
  company_name_size: integer
  company_name_color: text
  company_address: text
  company_email: text
  company_phone: text
  company_info_size: integer
  
  // Colors
  primary_color: text
  secondary_color: text
  text_color: text
  background_color: text
  
  // Typography
  font_family: text
  title_size: integer
  subtitle_size: integer
  body_size: integer
  
  // Page Layout
  page_size: varchar           // A4, LETTER, CUSTOM
  page_orientation: varchar    // portrait, landscape
  custom_width: numeric
  custom_height: numeric
  margin_top: integer
  margin_bottom: integer
  margin_left: integer
  margin_right: integer
  
  // Sections Toggle
  show_client_section: boolean
  show_project_section: boolean
  show_details_section: boolean
  show_signature_section: boolean
  
  // Footer
  footer_text: text
  footer_info: text
  show_footer_info: boolean
  footer_show_page_numbers: boolean
  footer_show_date: boolean
  
  // Signature
  signature_text: text
  show_signature_fields: boolean
  signature_layout: varchar    // single, double, triple
  show_clarification_field: boolean
  show_date_field: boolean
  
  // Metadata
  document_number: text
  created_at: timestamp
  updated_at: timestamp
}
```

### 3.2 Tablas Faltantes para Sistema Completo

```typescript
// REQUERIDO: Vincular templates a organizaciones
organization_pdf_templates: {
  id: uuid
  organization_id: uuid FK → organizations
  template_id: uuid FK → pdf_templates
  document_type: text         // 'payment_receipt', 'sitelog', 'budget', 'contract'
  is_default: boolean
  created_at: timestamp
}

// OPCIONAL: Versiones de templates
pdf_template_versions: {
  id: uuid
  template_id: uuid FK → pdf_templates
  version: integer
  config_snapshot: jsonb
  created_at: timestamp
  created_by: uuid FK → users
}
```

---

## 4. COMPONENTES EXISTENTES - ANÁLISIS DETALLADO

### 4.1 PdfDocument.tsx
**Estado:** ✅ Funcional pero limitado

```typescript
interface PdfDocumentProps {
  blocks: PdfBlock[];           // Array de bloques a renderizar
  config?: PdfConfig;           // pageSize, orientation, margin
  footerConfig?: FooterConfig;  // text, showDivider
  tableConfig?: TableConfig;    // titleSize, bodySize, groupBy, etc.
  headerConfig?: HeaderConfig;  // title, logo, projectInfo, etc.
}
```

**Limitaciones:**
- Solo soporta configs específicos de presupuestos
- No hay sistema dinámico de estilos por template
- No lee configuración de DB

### 4.2 PDFExporterModal.tsx (1132 líneas)
**Estado:** ⚠️ Funcional pero acoplado a budgets

**Funcionalidades implementadas:**
- Preview en tiempo real con pdfjs-dist
- Configuración de página (A4/Letter, orientación, márgenes)
- Configuración de header (logo, título, info proyecto)
- Configuración de tabla (tamaños, bordes, agrupación)
- Configuración de footer (texto, divisor)
- Download con nombre personalizado
- Debounce en inputs para performance

**Limitaciones:**
- UI hardcodeada para presupuestos
- No carga/guarda templates de DB
- No tiene selector de templates
- No hay restricciones por plan

### 4.3 InvoicePDF.tsx
**Estado:** ✅ Completo para su propósito

Genera facturas de suscripción Seencel con:
- Header con branding Seencel
- Info del cliente/organización
- Tabla de items (plan + período)
- Totales
- Footer

**Nota:** Este es un documento interno de Seencel, NO personalizable por organizaciones.

### 4.4 Bloques Disponibles

| Bloque | Propósito | Personalizable |
|--------|-----------|----------------|
| PdfHeader | Logo + título + info proyecto | Sí (limitado) |
| PdfFooter | Texto + divisor | Sí (básico) |
| PdfBudgetTable | Tabla de items presupuesto | Sí (limitado) |

**Bloques Faltantes:**
- PdfClientInfo (datos del cliente)
- PdfPaymentDetails (detalles de pago)
- PdfSignatureBlock (firmas)
- PdfSitelogEntry (entrada de bitácora)
- PdfPhotoGallery (galería de fotos)
- PdfProgressChart (gráfico de avance)

---

## 5. CASOS DE USO REQUERIDOS

### 5.1 PDFs para Clientes (Client Payments)

**Estado actual:** ❌ NO IMPLEMENTADO

**Requerido:**
- Comprobante de pago para cliente
- Resumen de pagos del cliente
- Cronograma de pagos pendientes

**Datos disponibles:**
- client_payments (monto, fecha, estado)
- client_commitments (compromiso, cuotas)
- project_clients (unidad, contacto)
- contacts (nombre, email, teléfono)

### 5.2 PDFs para Bitácora de Obra (Sitelog)

**Estado actual:** ❌ NO IMPLEMENTADO

**Requerido:**
- Entrada individual de bitácora
- Reporte diario/semanal/mensual
- Reporte con fotos (galería)

**Datos disponibles:**
- site_logs (fecha, descripción, clima, etc.)
- site_log_files (fotos, documentos)
- site_log_types (categorías)

### 5.3 PDFs para Subcontratos

**Estado actual:** ❌ NO IMPLEMENTADO

**Requerido:**
- Orden de compra/contrato
- Recibo de pago a subcontratista
- Resumen de certificaciones

### 5.4 PDFs para Presupuestos

**Estado actual:** ⚠️ PARCIALMENTE IMPLEMENTADO

**Implementado:**
- Export básico con PDFExporterModal
- Header con logo
- Tabla de items

**Faltante:**
- Guardar templates en DB
- Cargar templates guardados
- Diferenciación FREE/PRO

### 5.5 PDFs para Portal de Cliente

**Estado actual:** ❌ NO IMPLEMENTADO

**Requerido:**
- Vista de bitácora IDÉNTICA a la interna
- Resumen financiero
- Cronograma de pagos

---

## 6. ALINEACIÓN CON MASTER PROMPT

### Reglas Violadas

| Regla | Estado | Detalle |
|-------|--------|---------|
| #1 Lógicas generales 00-Arquitectura.md | ⚠️ Parcial | Feature existe pero no integrado |
| #8 Tablas Supabase | ❌ Violada | pdf_templates no está en schema.ts |
| No duplicar lógicas | ⚠️ Parcial | InvoicePDF duplica estilos del sistema |
| Usar endpoints backend | ❌ Violada | No hay endpoints para templates |

### Acciones Correctivas Requeridas

1. **Crear tabla pdf_templates en schema.ts**
2. **Crear endpoints backend:**
   - `GET /api/pdf/templates`
   - `POST /api/pdf/templates`
   - `PATCH /api/pdf/templates/:id`
   - `DELETE /api/pdf/templates/:id`
3. **Crear hooks frontend:**
   - `use-pdf-templates.ts`
4. **Integrar con PlanRestricted:**
   - FREE: 1 template básico
   - PRO: Templates ilimitados + branding
   - TEAMS: Templates + colaboración

---

## 7. ARQUITECTURA PROPUESTA

### 7.1 Estructura de Feature Completa

```
src/features/pdf/
├── components/
│   ├── blocks/                    # Bloques reutilizables
│   │   ├── PdfHeader.tsx
│   │   ├── PdfFooter.tsx
│   │   ├── PdfClientInfo.tsx      # NUEVO
│   │   ├── PdfPaymentDetails.tsx  # NUEVO
│   │   ├── PdfSignatureBlock.tsx  # NUEVO
│   │   ├── PdfSitelogEntry.tsx    # NUEVO
│   │   ├── PdfPhotoGallery.tsx    # NUEVO
│   │   ├── PdfTable.tsx           # NUEVO (genérico)
│   │   └── index.ts
│   ├── documents/                 # Documentos pre-armados
│   │   ├── PaymentReceiptPDF.tsx  # NUEVO
│   │   ├── SitelogReportPDF.tsx   # NUEVO
│   │   ├── BudgetPDF.tsx          # Refactor de actual
│   │   ├── ContractPDF.tsx        # NUEVO
│   │   └── InvoicePDF.tsx         # Existente
│   ├── PdfDocument.tsx
│   └── PdfViewer.tsx
├── forms/
│   └── PdfTemplateForm.tsx        # NUEVO - Editor de templates
├── hooks/
│   ├── use-pdf-templates.ts       # NUEVO
│   └── use-pdf-generator.ts       # NUEVO
├── modals/
│   ├── PDFExporterModal.tsx       # Refactor
│   └── PdfTemplateEditorModal.tsx # NUEVO
├── services/
│   ├── pdfService.ts
│   ├── pdfGenerator.ts            # NUEVO
│   └── pdfTemplateService.ts      # NUEVO
├── types/
│   ├── types.ts
│   └── templates.ts               # NUEVO
└── index.ts
```

### 7.2 Schema Drizzle Propuesto

```typescript
// En shared/schema.ts

export const pdfTemplates = pgTable('pdf_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  documentType: text('document_type').notNull(), // payment_receipt, sitelog, budget, contract
  isDefault: boolean('is_default').default(false),
  
  // Branding
  showLogo: boolean('show_logo').default(true),
  logoWidth: integer('logo_width').default(60),
  logoHeight: integer('logo_height').default(60),
  primaryColor: text('primary_color').default('#2563eb'),
  secondaryColor: text('secondary_color').default('#64748b'),
  
  // Typography
  fontFamily: text('font_family').default('Helvetica'),
  titleSize: integer('title_size').default(16),
  bodySize: integer('body_size').default(10),
  
  // Page
  pageSize: varchar('page_size', { length: 20 }).default('A4'),
  pageOrientation: varchar('page_orientation', { length: 20 }).default('portrait'),
  marginTop: integer('margin_top').default(40),
  marginBottom: integer('margin_bottom').default(40),
  marginLeft: integer('margin_left').default(40),
  marginRight: integer('margin_right').default(40),
  
  // Sections
  showHeader: boolean('show_header').default(true),
  showFooter: boolean('show_footer').default(true),
  showSignature: boolean('show_signature').default(false),
  footerText: text('footer_text'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 7.3 Diferenciación por Plan

| Feature | FREE | PRO | TEAMS |
|---------|------|-----|-------|
| Templates | 1 (sistema) | Ilimitados | Ilimitados |
| Logo propio | ❌ | ✅ | ✅ |
| Colores custom | ❌ | ✅ | ✅ |
| Múltiples tipos doc | ❌ | ✅ | ✅ |
| Export masivo | ❌ | ❌ | ✅ |
| Firma digital | ❌ | ❌ | ✅ |

---

## 8. PRÓXIMOS PASOS RECOMENDADOS

### Fase 1: Fundación (Prioridad Alta)
1. ✏️ Agregar tabla `pdf_templates` a schema.ts
2. ✏️ Crear migración SQL para usuario
3. ✏️ Crear endpoints CRUD para templates
4. ✏️ Crear hook `use-pdf-templates.ts`

### Fase 2: Bloques Genéricos (Prioridad Alta)
1. ✏️ Refactorizar bloques existentes para ser más genéricos
2. ✏️ Crear PdfClientInfo, PdfPaymentDetails, PdfSignatureBlock
3. ✏️ Crear PdfTable genérico

### Fase 3: Documentos Específicos (Prioridad Media)
1. ✏️ PaymentReceiptPDF para client_payments
2. ✏️ SitelogReportPDF para bitácora
3. ✏️ Integrar con portal de cliente

### Fase 4: Editor de Templates (Prioridad Media)
1. ✏️ PdfTemplateEditorModal con preview en vivo
2. ✏️ Guardar/cargar templates de DB
3. ✏️ Selector de template en export

### Fase 5: Restricciones por Plan (Prioridad Baja)
1. ✏️ Integrar PlanRestricted en editor
2. ✏️ Limitar features por plan
3. ✏️ Upsell en UI

---

## 9. CONCLUSIÓN

El sistema PDF de Seencel tiene una **base sólida** en `src/features/pdf/` pero está:
- **Incompleto**: Solo funciona para presupuestos
- **No persistente**: No guarda templates en DB
- **Sin diferenciación**: No hay restricciones por plan
- **Disperso**: Algunos PDFs (InvoicePDF) están separados del sistema

**Recomendación:** Implementar el sistema completo en fases, comenzando por la fundación de base de datos y bloques genéricos antes de crear documentos específicos.
