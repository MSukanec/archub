# AUDIT-GENERAL-COSTS.md - Compliance Report

## Overview
Audit and refactor of the GENERAL-COSTS feature to achieve 100% compliance with FEATURE-AUDIT.md standards.

**Date:** 2024-12-25
**Status:** ✅ COMPLETED (v2 - Full reorganization)

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
| Page file | ✅ | `src/pages/dashboard/GeneralCostsPage.tsx` |
| views/ folder | ✅ | `src/features/general-costs/views/` with 6 views |
| drawer/ folder | ✅ | `src/features/general-costs/drawer/` |
| Forms in forms/ | ✅ | GeneralCostForm.tsx, GeneralCostPaymentForm.tsx, etc. |
| Modal registry | ✅ | Uses new view paths |

**Views Structure:**
- `GeneralCostsDashboardView.tsx` - Main dashboard with KPIs
- `GeneralCostsConceptsView.tsx` - General costs concepts list
- `GeneralCostsPaymentsView.tsx` - Payments list with filters
- `GeneralCostsSettingsView.tsx` - Categories management
- `GeneralCostDetailView.tsx` - Single cost detail modal
- `GeneralCostPaymentDetailView.tsx` - Single payment detail modal

**Drawer Structure:**
- `GeneralCostPaymentDrawer.tsx` - Payment form in drawer format

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
| Page in src/pages/dashboard/ | ✅ | `GeneralCostsPage.tsx` |
| Page ends with Page.tsx | ✅ | Renamed from GeneralCosts.tsx |
| Views in features/views/ | ✅ | All 4 tab views + 2 detail views |
| Views end with View.tsx | ✅ | Renamed from *Tab.tsx |
| Drawer in features/drawer/ | ✅ | `GeneralCostPaymentDrawer.tsx` |
| Uses Layout components | ✅ | DashboardLayout and LabLayout |

---

## Files Modified

### New/Moved Files
- `src/core/query-keys/general-costs.keys.ts` - Centralized query keys factory
- `src/pages/dashboard/GeneralCostsPage.tsx` - Page file (moved from src/pages/general-costs/)
- `src/features/general-costs/views/GeneralCostsDashboardView.tsx` - Dashboard view
- `src/features/general-costs/views/GeneralCostsConceptsView.tsx` - Concepts view
- `src/features/general-costs/views/GeneralCostsPaymentsView.tsx` - Payments view
- `src/features/general-costs/views/GeneralCostsSettingsView.tsx` - Settings view
- `src/features/general-costs/views/GeneralCostDetailView.tsx` - Detail view
- `src/features/general-costs/views/GeneralCostPaymentDetailView.tsx` - Payment detail view
- `src/features/general-costs/drawer/GeneralCostPaymentDrawer.tsx` - Drawer form

### Modified Files
- `src/App.tsx` - Updated import path for GeneralCostsPage
- `src/core/query-keys/index.ts` - Added export
- `src/features/general-costs/index.ts` - Added generalCostsKeys export
- All hooks in `src/features/general-costs/hooks/` - Migrated to useOptimisticMutation
- `src/components/modal/factory/registerModals.ts` - Updated view paths

### Deleted Directories
- `src/pages/general-costs/` - Entire directory removed (files moved)

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
