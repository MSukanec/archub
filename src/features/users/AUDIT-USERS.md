# AUDIT-USERS: User Feature Compliance Report

## Feature Overview
The Users feature manages user profiles, preferences, organizations, and notifications. It follows the 3-layer architecture pattern (Page → Layout → View) and uses the enterprise Save Engine for autosave functionality.

## Audit Status: ✅ COMPLIANT

### 1. Directory Structure ✅

```
src/features/users/
├── AUDIT-USERS.md          # This compliance document
├── index.ts                # Public exports
├── views/
│   ├── UserBasicDataView.tsx      # Profile & personal info
│   ├── UserPreferencesView.tsx    # Theme, sidebar settings
│   ├── UserOrganizationsView.tsx  # Organization switcher
│   └── UserNotificationsView.tsx  # Notification center
├── hooks/
│   ├── index.ts                   # Hook exports
│   └── useCurrentUser.ts          # Main user data hook (uses usersKeys.current())
├── services/
│   ├── index.ts                   # Service exports
│   ├── userProfileService.ts      # Profile update operations
│   └── onboardingChecklist.ts     # Onboarding checklist management (from src/features/onboarding)
├── components/                    # Flattened: NO SUBFOLDERS (9 active files)
│   ├── AuthGuard.tsx              # Authentication protection
│   ├── AuthAdmin.tsx              # Admin auth component
│   ├── NotificationBell.tsx       # Bell icon in header
│   ├── NotificationDropdown.tsx   # Notification list
│   ├── GlobalAnnouncement.tsx     # Global notification banner
│   ├── UserSelectorField.tsx      # User dropdown selector
│   ├── AdminUserRow.tsx           # Admin user list row
│   └── AdminChangelogRow.tsx      # Admin changelog row
├── forms/                         # Agnostic forms (6 files) - SEPARATED FROM MODALS
│   ├── UserForm.tsx               # Exports: FormPanel, ViewPanel, useUserForm
│   ├── NotificationForm.tsx       # Exports: FormPanel, ViewPanel, useNotificationForm
│   ├── AnnouncementForm.tsx       # Exports: FormPanel, ViewPanel, useAnnouncementForm
│   ├── ChangelogForm.tsx          # Exports: FormPanel, ViewPanel, useChangelogForm
│   ├── SupportForm.tsx            # Exports: ChatPanel, FooterPanel, useSupportChat
│   └── OnboardingForm.tsx         # Onboarding user data form (moved from components/)
├── modals/                        # Modal wrappers (9 files) - ENVASES ONLY
│   ├── UserModal.tsx              # Uses UserForm
│   ├── NotificationModal.tsx      # Uses NotificationForm
│   ├── AnnouncementModal.tsx      # Uses AnnouncementForm
│   ├── ChangelogModal.tsx         # Uses ChangelogForm
│   ├── SupportModal.tsx           # Uses SupportForm (chat)
│   ├── SupportConversationStartModal.tsx
│   ├── ResetTestDataModal.tsx
│   ├── UpgradeModal.tsx
│   └── InvitationModal.tsx
└── (MemberRow.tsx, PlanBadge.tsx, PlanForm.tsx, PlanModal.tsx, PlanUpgradeModal.tsx, DowngradeModal.tsx → organization/)
```

### 2. Query Keys ✅ COMPLIANT

All query keys centralized in `src/core/query-keys/users.keys.ts`:

```typescript
export const usersKeys = {
  all: () => ['users'] as const,
  current: () => ['current-user'] as const,
  profile: (userId: string) => ['user-profile', userId] as const,
  preferences: (userId: string) => ['user-preferences', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  organizations: (userId: string) => ['user-organizations', userId] as const,
} as const;
```

### 3. 3-Layer Architecture ✅ COMPLIANT

**Page Layer** (`src/pages/dashboard/UserPage.tsx`):
- Orchestrates layout selection (LabLayout vs DashboardLayout)
- Manages tab state
- Renders appropriate View component

**Layout Layer**:
- Uses `DashboardLayout` or `LabLayout` based on user preference
- Handles header, tabs, action buttons

**View Layer** (`src/features/users/views/*`):
- Pure UI components with data fetching
- Each view is self-contained
- Uses `useAutosaveController` for save operations

### 4. Save Engine Integration ✅ COMPLIANT

**UserBasicDataView.tsx** and **UserPreferencesView.tsx** use:
- `useAutosaveController` from `@/core/autosave`
- Blur/Enter triggers for saving
- Normalization via `normalizeStringValue`
- Dirty checking to avoid unnecessary saves
- Hydration pattern with refs to prevent double-save on mount

### 5. Cache Invalidation ✅ COMPLIANT

- Uses scoped query keys: `usersKeys.current()`, `usersKeys.notifications(userId)`
- NO broad invalidations like `usersKeys.all()` in mutations
- Invalidation scoped to specific user data

### 6. Badge Variants ✅ COMPLIANT

Uses semantic badge variants:
- `plan-free`, `plan-pro`, `plan-teams` for plan badges in UserOrganizationsView
- `info`, `success`, `neutral` for notification type badges in UserNotificationsView
- NO usage of deprecated `secondary`, `default`, `outline` variants

### 7. Performance Standards ✅ COMPLIANT

- Auto-save delay: Uses controller default (≤800ms)
- Cache invalidations: Always scoped
- Optimistic updates: Handled by autosave controller

## Migration Notes

### Deprecated Files (DELETED)
- `src/features/user/` (singular) - Consolidated into `src/features/users/`
- `src/pages/profile/` - Consolidated into `UserPage.tsx`
- `src/pages/user/User.tsx` - Replaced by `UserPage.tsx`

### Route Changes
- `/profile/*` routes now render `UserPage` (backward compatibility)
- `/user` is the canonical route for user settings

## Checklist

- [x] Centralized query keys in `core/query-keys/users.keys.ts`
- [x] 3-layer architecture (Page → Layout → View)
- [x] Enterprise autosave controller
- [x] Scoped cache invalidations
- [x] Semantic badge variants
- [x] No deprecated patterns
- [x] Consolidated directory structure
- [x] Updated App.tsx routing
- [x] Deleted obsolete files

## Last Updated
2025-12-25 - Initial audit compliance
2025-12-25 - Fixed badge variants and cache invalidation guards
2025-12-25 - Added hooks/ and services/ with useCurrentUser and userProfileService
2025-12-25 - Flattened components/ - removed all subfolders, moved 16 files directly to components/
2025-12-26 - Consolidated onboarding into users feature: moved onboarding/services/checklist.ts → users/services/onboardingChecklist.ts, deleted src/features/onboarding/, updated imports in use-update-checklist.ts to use centralized query keys
2025-12-26 - Removed 4 legacy components: NotificationBellHeader, UserQuickAccess, SupportPanel, OnlineUsersIndicator (unused)
2025-12-26 - Flattened modals/ - removed admin/ and plans/ subfolders, moved 12 modal files directly to modals/, updated all imports
2025-12-26 - Moved MemberRow.tsx and PlanBadge.tsx to organization/components (they belong there)
2025-12-26 - MAJOR: Separated forms from modals following FEATURE-AUDIT.md pattern:
  - Created forms/: UserForm, PlanForm, NotificationForm, AnnouncementForm, ChangelogForm, SupportForm
  - Renamed modals: *FormModal → *Modal (UserModal, PlanModal, NotificationModal, AnnouncementModal, ChangelogModal)
  - Moved SupportModal from components/ to modals/, extracted logic to SupportForm
  - Each form exports: FormPanel, ViewPanel (optional), useXxxForm hook
  - Each modal is now just an "envase" that imports and uses the form
