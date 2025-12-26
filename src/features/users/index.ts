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

// Modals
export { AdminUserModal } from './modals/AdminUserModal';
export { AdminNotificationModal } from './modals/AdminNotificationModal';
export { AdminSupportConversationStartModal } from './modals/AdminSupportConversationStartModal';
export { AdminAnnouncementModal } from './modals/AdminAnnouncementModal';
export { AdminChangelogModal } from './modals/AdminChangelogModal';
export { default as AdminResetTestDataModal } from './modals/AdminResetTestDataModal';
export { AdminSupportModal } from './modals/AdminSupportModal';

// Legacy aliases for backwards compatibility
export { AdminUserModal as UserModal } from './modals/AdminUserModal';
export { AdminNotificationModal as NotificationModal } from './modals/AdminNotificationModal';
export { AdminSupportConversationStartModal as SupportConversationStartModal } from './modals/AdminSupportConversationStartModal';
export { AdminAnnouncementModal as AnnouncementModal } from './modals/AdminAnnouncementModal';
export { AdminChangelogModal as ChangelogModal } from './modals/AdminChangelogModal';
export { default as ResetTestDataModal } from './modals/AdminResetTestDataModal';
export { AdminSupportModal as SupportModal } from './modals/AdminSupportModal';

// Support Forms
export { useSupportConversationStartForm } from './forms/AdminSupportConversationStartForm';

// Organization Modals & Forms (re-export from organization)
export { PlanModal, PlanUpgradeModal, DowngradeModal, InvitationModal, UpgradeModal } from '@/features/organization';

// Auth Components
export { AuthGuard } from './components/AuthGuard';
export { AuthAdmin } from './components/AuthAdmin';

// Notification Components
export { NotificationBell } from './components/NotificationBell';
export { NotificationDropdown } from './components/NotificationDropdown';

// Plan Components (re-export from organization)
export { default as PlanBadge } from '@/features/organization/components/PlanBadge';
export { PlanRestricted } from '@/components/shared/restrictions';

// Restriction Components (re-export from new architecture)
export { RoleRestricted, ContextRestricted, RestrictionOverlay, EmptyStateBlock } from '@/components/shared/restrictions';

// Announcement Components (Banner)
export { GlobalAnnouncementBanner, AnnouncementProvider, useAnnouncementBanner } from './components/GlobalAnnouncementBanner';
export { GlobalAnnouncementBanner as GlobalAnnouncement } from './components/GlobalAnnouncementBanner';

// Field Components
export { default as UserSelectorField } from './components/UserSelectorField';

// Admin Components
export { default as AdminUserRow } from './components/AdminUserRow';
export { default as AdminChangelogRow } from './components/AdminChangelogRow';

// Onboarding Forms
export { OnboardingForm, OnboardingForm as Step1UserData } from './forms/OnboardingForm';

// Member Components (re-export from organization)
export { default as MemberRow } from '@/features/organization/components/MemberRow';
