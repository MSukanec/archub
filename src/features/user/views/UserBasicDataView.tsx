import { ProfileBasicData } from '@/pages/profile/ProfileBasicData';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

/**
 * View: User Basic Data
 * Displays user profile information: name, avatar, country, birthdate, user mode
 */
export function UserBasicDataView() {
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

  return <ProfileBasicData user={userData.user} />;
}
