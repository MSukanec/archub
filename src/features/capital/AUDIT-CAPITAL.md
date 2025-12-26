# AUDIT REPORT: Feature CAPITAL

**Fecha de auditoría:** 2025-12-26  
**Auditor:** AI Agent  
**Estándar aplicado:** FEATURE-AUDIT.md v1.0  
**Resultado:** ✅ CERRADO

---

## 1. RESUMEN EJECUTIVO

| Aspecto | Status | Notas |
|---------|--------|-------|
| Query Keys Centralizadas | ✅ | source of truth en `src/core/query-keys/capital.keys.ts` |
| Data Layer (types) | ✅ | Contributions, Withdrawals, Adjustments typed |
| Services Layer | ✅ | Get, Create, Update, Delete para todas las entidades |
| Hooks Layer | ✅ | useCapitalAdjustments, useCreateCapitalAdjustment, etc. |
| Ledger Unificado | ✅ | mergeCapitalMovements() en `services/mergeCapitalMovements.ts` |
| Cache Invalidation | ✅ | SCOPED por organizationId, projectId (NUNCA all()) |
| Soft Delete | ✅ | `is_deleted NOT NULL` en todas las tablas |
| Database Triggers | ✅ | Auto-update de `partner_capital_balance` |
| Type Safety | ✅ | TypeScript + Zod cuando aplica |
| Console Logs | ✅ | CERO en producción |

---

## 2. MAPA DEL FEATURE

```
src/features/capital/
├── types/index.ts
│   ├── CapitalParticipant
│   ├── CapitalContribution
│   ├── CapitalWithdrawal
│   ├── CapitalAdjustment ✨ NUEVO
│   └── LedgerEntry (union type)
├── services/
│   ├── getCapitalParticipants.ts
│   ├── getCapitalAdjustments.ts ✨ NUEVO
│   ├── createCapitalAdjustment.ts ✨ NUEVO
│   ├── updateCapitalAdjustment.ts ✨ NUEVO
│   ├── deleteCapitalAdjustment.ts ✨ NUEVO
│   ├── mergeCapitalMovements.ts ✨ NUEVO (ledger unifier)
│   ├── {create,update,delete}PartnerContribution.ts
│   └── {create,update,delete}PartnerWithdrawal.ts
├── hooks/
│   ├── use-capital-participants.ts
│   ├── use-capital-adjustments.ts ✨ NUEVO
│   ├── use-partner-contributions.ts
│   └── use-partner-withdrawals.ts
├── views/
│   ├── CapitalParticipantsListView.tsx
│   └── CapitalTransactionsView.tsx
└── AUDIT-CAPITAL.md (este documento)

src/core/query-keys/
└── capital.keys.ts ✨ CONSOLIDATED
    ├── participantsList(orgId)
    ├── contributionsList(orgId, projectId)
    ├── withdrawalsList(orgId, projectId)
    ├── adjustmentsList(orgId, projectId) ✨ NUEVO
    └── unifiedMovements() ← El ledger merge
```

---

## 3. CAMBIOS PRINCIPALES

### 3.1 Data Layer ✅
- `CapitalAdjustment` type con amount SIGNED (puede ser + o -)
- `LedgerEntry` union type (contribution | withdrawal | adjustment)
- Signed amount handling documentado

### 3.2 Services ✅
- `getCapitalAdjustments()` + `getCapitalAdjustmentById()`
- `createCapitalAdjustment()` 
- `updateCapitalAdjustment()`
- `deleteCapitalAdjustment()` (soft delete)
- `mergeCapitalMovements()` — unifica las 3 tablas en un ledger

### 3.3 Hooks ✅
- `useCapitalAdjustments()` (query list)
- `useCapitalAdjustment()` (query single)
- `useCreateCapitalAdjustment()` (mutation)
- `useUpdateCapitalAdjustment()` (mutation)
- `useDeleteCapitalAdjustment()` (mutation)
- Todas invalidan: adjustmentsList + unifiedMovements + partnerMovements

### 3.4 Query Keys ✅
- `capitalKeys.adjustmentsList(orgId, projectId?)` — SCOPED
- `capitalKeys.adjustment(adjustmentId)` — single
- Todos los query keys centralizados en UNA fuente de verdad

### 3.5 Database ✅
- Tabla `capital_adjustments` en Supabase (schema en `prompts/tables/capital.md`)
- Triggers SQL auto-actualizan `partner_capital_balance`
- Setup SQL en `sql/capital-adjustments-setup.sql` (ejecutar manualmente)

---

## 4. CACHE INVALIDATION RULES

**CRÍTICO:** Cuando creas/editas/borra un adjustment:

```typescript
queryClient.invalidateQueries({ queryKey: capitalKeys.adjustmentsList(orgId) })
queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() })
queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(orgId) })
```

✅ Ya implementado en todos los mutation hooks.

---

## 5. LEDGER MERGE LOGIC

`mergeCapitalMovements(contributions, withdrawals, adjustments)` retorna `LedgerEntry[]` con:

```typescript
// Entrada: monto positivo
{ type: 'contribution', signedAmount: 1000 }

// Salida: monto NEGATIVO (amount invertido)
{ type: 'withdrawal', signedAmount: -500 }

// Ajuste: monto SIGNED (como viene)
{ type: 'adjustment', signedAmount: -200 }
```

Sorted by date (descending, newest first).

---

## 6. ENTREGABLES COMPLETADOS

✅ Types, Services, Hooks, Query Keys  
✅ mergeCapitalMovements() service  
✅ AUDIT-CAPITAL.md documentation  
✅ SQL setup (sql/capital-adjustments-setup.sql)  
✅ Query keys consolidation  

---

## 7. PRÓXIMOS PASOS (NO INCLUIDOS EN ESTE AUDIT)

1. **UI "Capital Ledger"** — tabla que usa `mergeCapitalMovements()` + hooks
2. **Form para crear adjustments** — modal/drawer similar a contributions
3. **Dashboard KPI** — capital balance + últimas transacciones
4. **Bulk import** — CSV de adjustments

---

## 8. CONDICIÓN FINAL

**STATUS: ✅ CERRADO - Data layer completa y lista para UI**

Todo el backend de Capital Adjustments está listo. Solo falta implementar los componentes visuales que usan los hooks.
