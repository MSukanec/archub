import { ProfilePreferences } from '@/pages/profile/ProfilePreferences';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

/**
 * View: User Preferences
 * Displays user settings: theme, sidebar docking, notifications
 */
export function UserPreferencesView() {
  const { data: userData, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Usuario no encontrado</div>
      </div>
    );
  }

  return <ProfilePreferences user={userData.user} />;
}
