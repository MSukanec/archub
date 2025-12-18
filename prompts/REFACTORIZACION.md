# Guía de Refactorización de Páginas

Este documento contiene las instrucciones para refactorizar páginas de Seencel siguiendo los estándares actuales del proyecto.

---

## 1. Tablas (`Table`)

### 1.1 Componente a Usar
- Usar siempre el componente de `src/components/shared/table` según la lógica documentada en `src/components/shared/table/AUDIT.md`.

### 1.2 Sistema de Anchos Semánticos

Las columnas deben usar el sistema de **tipos semánticos** para definir su ancho automáticamente. Ver `src/components/shared/table/tableColumnTypes.ts`.

**Tipos disponibles:**

| Tipo | Ancho | Uso |
|------|-------|-----|
| `date` | 110px | Fechas simples |
| `datetime` | 150px | Fecha + hora |
| `amount` | 120px | Montos monetarios |
| `status` | 100px | Estados/badges pequeños |
| `wallet` | 140px | Billeteras/cuentas |
| `number` | 80px | Números simples |
| `id` | 100px | Identificadores |
| `actions` | 48px | Columna de acciones |
| `name` | 200px | Nombres de entidades |
| `email` | 200px | Emails |
| `short-text` | 140px | Texto corto (DEFAULT) |
| `medium-text` | 180px | Texto medio |
| `long-text` | FLEXIBLE | Ocupa el ancho restante |
| `badge` | 120px | Badges/etiquetas |
| `avatar` | 48px | Avatares |
| `checkbox` | 40px | Checkboxes |
| `icon` | 40px | Iconos |

### 1.3 Columna Flexible (`long-text`)

Cuando refactorices una tabla, **siempre pregunta cuál columna debería tomar el ancho restante** (tipo `long-text`). Esta columna:

- Absorbe todo el espacio sobrante de la tabla
- Garantiza que la tabla ocupe el 100% del ancho disponible
- Solo debe haber **UNA** columna `long-text` por tabla (recomendado)

**Ejemplo:** En la tabla de Organizaciones, la columna "Organización" usa `type: 'long-text'` para ocupar el espacio restante.

### 1.4 Ejemplo de Columna con Tipo Semántico

```typescript
const columns = [
  {
    key: 'created_at',
    label: 'Fecha',
    type: 'date' as const,  // ← Tipo semántico
    render: (item) => formatDate(item.created_at)
  },
  {
    key: 'name',
    label: 'Nombre',
    type: 'long-text' as const,  // ← Esta absorbe el ancho restante
    render: (item) => item.name
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'status' as const,
    render: (item) => <Badge>{item.status}</Badge>
  }
];
```

---

## 2. Badges

- Usar siempre el componente `Badge.tsx` en su variante `default`.
- **NO** hardcodear colores ni estilos.

---

## 3. Headers de Página

- La página debe tener en su header el **mismo ícono** que en su sidebar.
- El header debe tener una **descripción** en su prop `description`.

---

## 4. IdentityBadge

Para mostrar entidades con avatar (usuarios, organizaciones), usar `src/components/shared/IdentityBadge.tsx`:

```typescript
<IdentityBadge
  name={organization.name}
  avatarUrl={organization.image_url}
  size="sm"
  showName={true}
/>
```

---

## 5. Checklist de Refactorización

Antes de considerar una página refactorizada, verificar:

- [ ] Tabla usa `src/components/shared/table`
- [ ] Columnas usan tipos semánticos (no `width` hardcodeado)
- [ ] Una columna tiene `type: 'long-text'` para ancho flexible
- [ ] Badges usan variante `default` sin colores hardcodeados
- [ ] Header tiene ícono y descripción
- [ ] Entidades con avatar usan `IdentityBadge`
