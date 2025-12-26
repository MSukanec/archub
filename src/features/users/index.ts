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
export { UserModal } from './modals/UserModal';
export { PlanModal } from './modals/PlanModal';
export { PlanPriceFormModal } from './modals/PlanPriceFormModal';
export { NotificationModal } from './modals/NotificationModal';
export { SupportConversationStartModal } from './modals/SupportConversationStartModal';
export { AnnouncementModal } from './modals/AnnouncementModal';
export { ChangelogModal } from './modals/ChangelogModal';
export { default as ResetTestDataModal } from './modals/ResetTestDataModal';
export { PlanUpgradeModal } from './modals/PlanUpgradeModal';
export { DowngradeModal } from './modals/DowngradeModal';
export { UpgradeModal } from './modals/UpgradeModal';
export { InvitationModal } from './modals/InvitationModal';

// Auth Components
export { AuthGuard } from './components/AuthGuard';
export { AuthAdmin } from './components/AuthAdmin';

// Notification Components
export { NotificationBell } from './components/NotificationBell';
export { NotificationDropdown } from './components/NotificationDropdown';

// Support Components
export { SupportModal } from './components/SupportModal';

// Plan Components (re-export from organization)
export { default as PlanBadge } from '@/features/organization/components/PlanBadge';
export { PlanRestricted } from '@/components/shared/restrictions';

// Restriction Components (re-export from new architecture)
export { RoleRestricted, ContextRestricted, RestrictionOverlay, EmptyStateBlock } from '@/components/shared/restrictions';

// Announcement Components
export { GlobalAnnouncement, AnnouncementProvider, useAnnouncementBanner } from './components/GlobalAnnouncement';

// Field Components
export { default as UserSelectorField } from './components/UserSelectorField';

// Admin Components
export { default as AdminUserRow } from './components/AdminUserRow';
export { default as AdminChangelogRow } from './components/AdminChangelogRow';

// Onboarding Components
export { Step1UserData } from './components/Step1UserData';

// Member Components (re-export from organization)
export { default as MemberRow } from '@/features/organization/components/MemberRow';
