// Views
export { UserBasicDataView } from './views/UserBasicDataView';
export { UserPreferencesView } from './views/UserPreferencesView';
export { UserOrganizationsView } from './views/UserOrganizationsView';
export { UserNotificationsView } from './views/UserNotificationsView';

// Admin Modals
export { UserFormModal } from './modals/admin/UserFormModal';
export { PlanFormModal } from './modals/admin/PlanFormModal';
export { PlanPriceFormModal } from './modals/admin/PlanPriceFormModal';
export { NotificationFormModal } from './modals/admin/NotificationFormModal';
export { SupportConversationStartModal } from './modals/admin/SupportConversationStartModal';
export { AnnouncementFormModal } from './modals/admin/AnnouncementFormModal';
export { ChangelogFormModal } from './modals/admin/ChangelogFormModal';
export { default as ResetTestDataModal } from './modals/admin/ResetTestDataModal';

// Plan Modals
export { PlanUpgradeModal } from './modals/plans/PlanUpgradeModal';
export { DowngradeModal } from './modals/DowngradeModal';
export { UpgradeModal } from './modals/UpgradeModal';

// Auth Components
export { AuthGuard } from './components/auth/AuthGuard';
export { AuthAdmin } from './components/auth/AuthAdmin';

// Notification Components
export { NotificationBell } from './components/notifications/NotificationBell';
export { NotificationBellHeader } from './components/notifications/NotificationBellHeader';
export { NotificationDropdown } from './components/notifications/NotificationDropdown';

// Support Components
export { SupportModal } from './components/support/SupportModal';
export { SupportPanel } from './components/support/SupportPanel';

// Plan Components
export { default as PlanBadge } from './components/plans/PlanBadge';
export { PlanRestricted } from '@/components/shared/restrictions';

// Restriction Components (re-export from new architecture)
export { RoleRestricted, ContextRestricted, RestrictionOverlay, EmptyStateBlock } from '@/components/shared/restrictions';

// Announcement Components
export { GlobalAnnouncement, AnnouncementProvider, useAnnouncementBanner } from './components/announcements/GlobalAnnouncement';

// Presence Components
export { OnlineUsersIndicator } from './components/presence/OnlineUsersIndicator';

// Field Components
export { default as UserSelectorField } from './components/fields/UserSelectorField';
export { UserQuickAccess } from './components/fields/UserQuickAccess';

// Admin Components
export { default as AdminUserRow } from './components/admin/AdminUserRow';

// Onboarding Components
export { Step1UserData } from './components/onboarding/Step1UserData';
