import { ProfileOrganizations } from '@/pages/profile/ProfileOrganizations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

/**
 * View: User Organizations
 * Displays organizations the user belongs to with management options
 */
export function UserOrganizationsView() {
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

  return <ProfileOrganizations user={userData.user} />;
}
