// Views
export { UserBasicDataView } from './views/UserBasicDataView';
export { UserPreferencesView } from './views/UserPreferencesView';
export { UserOrganizationsView } from './views/UserOrganizationsView';
export { UserNotificationsView } from './views/UserNotificationsView';

// Hooks
export { useCurrentUser, refreshCurrentUserCache, type UserData } from './hooks';

// Services
export { 
  updateUserProfile, 
  updateUserPreferences, 
  switchOrganization,
  type UpdateProfileData,
  type UpdatePreferencesData 
} from './services';

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
export { AuthGuard } from './components/AuthGuard';
export { AuthAdmin } from './components/AuthAdmin';

// Notification Components
export { NotificationBell } from './components/NotificationBell';
export { NotificationBellHeader } from './components/NotificationBellHeader';
export { NotificationDropdown } from './components/NotificationDropdown';

// Support Components
export { SupportModal } from './components/SupportModal';
export { SupportPanel } from './components/SupportPanel';

// Plan Components
export { default as PlanBadge } from './components/PlanBadge';
export { PlanRestricted } from '@/components/shared/restrictions';

// Restriction Components (re-export from new architecture)
export { RoleRestricted, ContextRestricted, RestrictionOverlay, EmptyStateBlock } from '@/components/shared/restrictions';

// Announcement Components
export { GlobalAnnouncement, AnnouncementProvider, useAnnouncementBanner } from './components/GlobalAnnouncement';

// Presence Components
export { OnlineUsersIndicator } from './components/OnlineUsersIndicator';

// Field Components
export { default as UserSelectorField } from './components/UserSelectorField';
export { UserQuickAccess } from './components/UserQuickAccess';

// Admin Components
export { default as AdminUserRow } from './components/AdminUserRow';
export { default as AdminChangelogRow } from './components/AdminChangelogRow';

// Onboarding Components
export { Step1UserData } from './components/Step1UserData';

// Member Components
export { default as MemberRow } from './components/MemberRow';
