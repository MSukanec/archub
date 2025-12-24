# AUDIT-GENERAL-COSTS.md - Compliance Report

## Overview
Audit and refactor of the GENERAL-COSTS feature to achieve 100% compliance with FEATURE-AUDIT.md standards.

**Date:** 2024-12-24
**Status:** ✅ COMPLETED

---

## Checklist Summary

### 1. Query Keys Centralization
| Item | Status | Notes |
|------|--------|-------|
| Created centralized factory | ✅ | `src/core/query-keys/general-costs.keys.ts` |
| Exported in index.ts | ✅ | Added to `src/core/query-keys/index.ts` |
| Uses NullableId type | ✅ | All keys accept `string | null | undefined` |
| Scoped to organizationId | ✅ | All list keys require organizationId |

**Query Keys Structure:**
```typescript
export const generalCostsKeys = {
  all: ['general-costs'] as const,
  list: (organizationId: NullableId) => [..., organizationId] as const,
  detail: (id: NullableId) => [..., id] as const,
  paymentList: (organizationId: NullableId) => [..., organizationId] as const,
  paymentDetail: (paymentId: NullableId) => [..., paymentId] as const,
  paymentMedia: (paymentId: NullableId, organizationId: NullableId) => [...] as const,
  categoryList: (organizationId: NullableId) => [..., organizationId] as const,
  categoryDetail: (categoryId: NullableId) => [..., categoryId] as const,
  monthlySummary: (organizationId: NullableId) => [..., organizationId] as const,
  byCategory: (organizationId: NullableId) => [..., organizationId] as const,
  metrics: (organizationId: NullableId) => [..., organizationId] as const,
}
```

### 2. Hooks Migration
| Hook | Migration Status | Pattern |
|------|------------------|---------|
| use-general-costs.ts | ✅ | useQuery + staleTime: 30000 |
| use-general-cost.ts | ✅ | useQuery + staleTime: 30000 |
| use-create-general-cost.ts | ✅ | useOptimisticMutation |
| use-update-general-cost.ts | ✅ | useOptimisticMutation |
| use-delete-general-cost.ts | ✅ | useOptimisticMutation |
| use-replace-general-cost.ts | ✅ | useOptimisticMutation |
| use-general-costs-payments.ts | ✅ | useQuery + staleTime: 30000 |
| use-general-cost-payment.ts | ✅ | useQuery + staleTime: 30000 |
| use-create-general-cost-payment.ts | ✅ | useOptimisticMutation |
| use-update-general-cost-payment.ts | ✅ | useOptimisticMutation |
| use-delete-general-cost-payment.ts | ✅ | useOptimisticMutation |
| use-general-cost-payment-media.ts | ✅ | useQuery + staleTime: 30000 |
| use-general-cost-categories.ts | ✅ | useQuery + CRUD mutations with useOptimisticMutation |
| use-replace-general-cost-category.ts | ✅ | useOptimisticMutation |
| use-general-costs-metrics.ts | ✅ | useMemo (local calculation, no query) |
| use-general-costs-monthly-summary.ts | ✅ | useQuery + staleTime: 30000 |
| use-general-costs-by-category.ts | ✅ | useQuery + staleTime: 30000 |

### 3. Cache Invalidation Optimization
| Before | After |
|--------|-------|
| `generalCostsKeys.lists()` (global) | `generalCostsKeys.list(organizationId)` (scoped) |
| `generalCostsKeys.payments()` (global) | `generalCostsKeys.paymentList(organizationId)` (scoped) |
| `generalCostsKeys.monthlySummary()` (global) | `generalCostsKeys.monthlySummary(organizationId)` (scoped) |
| Multiple sequential invalidations | Single optimistic update + scoped additional keys |

### 4. File Organization
| Category | Status | Notes |
|----------|--------|-------|
| views/ folder | ✅ | Created `src/features/general-costs/views/` |
| GeneralCostDetailView.tsx | ✅ | Moved from forms/ |
| GeneralCostPaymentDetailView.tsx | ✅ | Moved from forms/, fixed Badge variants |
| Forms remain in forms/ | ✅ | GeneralCostForm, GeneralCostPaymentForm, etc. |
| Modal registry updated | ✅ | `registerModals.ts` uses new paths |

### 5. Performance Standards
| Metric | Target | Status |
|--------|--------|--------|
| Auto-save delay | ≤500ms | ✅ N/A (uses form submit, not autosave) |
| staleTime on queries | 30000ms | ✅ Applied to all queries |
| Optimistic updates | Required | ✅ All mutations use useOptimisticMutation |
| Scoped invalidations | Required | ✅ No global invalidations |
| Null-safe queryFn | Required | ✅ All queryFn check for null before calling services |

### 6. Code Quality
| Item | Status | Notes |
|------|--------|-------|
| Removed console.log debug | ✅ | Removed from GeneralCostCategoryForm.tsx |
| Fixed Badge variant errors | ✅ | Updated STATUS_MAP to use semantic variants |
| Fixed undefined variable | ✅ | Fixed `secondaryRightContent` → `periodContent` in page |
| Updated imports | ✅ | Page uses correct hook imports |

### 7. Page Architecture
| Item | Status | Notes |
|------|--------|-------|
| Pages exist in src/pages/ | ✅ | `src/pages/general-costs/` |
| Page/View separation | ✅ | GeneralCosts.tsx is page, tabs are views |
| Uses Layout components | ✅ | DashboardLayout and LabLayout |

---

## Files Modified

### New Files
- `src/core/query-keys/general-costs.keys.ts`
- `src/features/general-costs/views/GeneralCostDetailView.tsx` (moved)
- `src/features/general-costs/views/GeneralCostPaymentDetailView.tsx` (moved)

### Modified Files
- `src/core/query-keys/index.ts` - Added export
- `src/features/general-costs/hooks/use-general-costs.ts`
- `src/features/general-costs/hooks/use-general-cost.ts`
- `src/features/general-costs/hooks/use-create-general-cost.ts`
- `src/features/general-costs/hooks/use-update-general-cost.ts`
- `src/features/general-costs/hooks/use-delete-general-cost.ts`
- `src/features/general-costs/hooks/use-replace-general-cost.ts`
- `src/features/general-costs/hooks/use-general-costs-payments.ts`
- `src/features/general-costs/hooks/use-general-cost-payment.ts`
- `src/features/general-costs/hooks/use-create-general-cost-payment.ts`
- `src/features/general-costs/hooks/use-update-general-cost-payment.ts`
- `src/features/general-costs/hooks/use-delete-general-cost-payment.ts`
- `src/features/general-costs/hooks/use-general-cost-payment-media.ts`
- `src/features/general-costs/hooks/use-general-cost-categories.ts`
- `src/features/general-costs/hooks/use-replace-general-cost-category.ts`
- `src/features/general-costs/hooks/use-general-costs-metrics.ts`
- `src/features/general-costs/hooks/use-general-costs-monthly-summary.ts`
- `src/features/general-costs/hooks/use-general-costs-by-category.ts`
- `src/features/general-costs/forms/GeneralCostCategoryForm.tsx`
- `src/components/modal/factory/registerModals.ts`
- `src/pages/general-costs/GeneralCosts.tsx`

### Deleted Files
- `src/features/general-costs/forms/GeneralCostView.tsx` (moved to views/)
- `src/features/general-costs/forms/GeneralCostPaymentView.tsx` (moved to views/)

---

## Patterns Applied

### useOptimisticMutation Pattern
```typescript
const mutation = useOptimisticMutation<ReturnType, Input>({
  mutationFn: async (input) => { /* ... */ },
  queryKey: generalCostsKeys.list(organizationId),
  optimisticUpdate: (oldData, input) => {
    if (!oldData) return oldData;
    // Optimistic update logic - adds temp entry
  },
  additionalQueryKeys: [
    // Scoped invalidation after success (with organizationId)
    generalCostsKeys.monthlySummary(organizationId),
    generalCostsKeys.byCategory(organizationId),
  ],
  onSuccessMessage: 'Operación exitosa',
  onErrorMessage: 'Error en la operación',
});
```

**Cache Reconciliation Strategy:**
The useOptimisticMutation hook uses a standard TanStack Query pattern:
1. **onMutate**: Applies optimistic update with temp entry
2. **onError**: Rolls back to previousData
3. **onSettled**: Invalidates queryKey to refetch server data (replaces temp entries)

This pattern ensures data consistency by refetching from the server after mutations, which automatically replaces any temporary entries with actual server-returned data.

### Query with staleTime Pattern
```typescript
const query = useQuery<ReturnType>({
  queryKey: generalCostsKeys.list(organizationId),
  queryFn: async () => { /* ... */ },
  enabled: !!organizationId,
  staleTime: 30000,
});
```

---

## Compliance Score: 100%

All FEATURE-AUDIT.md requirements have been met for the GENERAL-COSTS feature.
