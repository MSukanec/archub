import { ProfilePreferences } from '@/pages/profile/ProfilePreferences';

interface UserPreferencesTabProps {
  user: any;
}

export default function UserPreferencesTab({ user }: UserPreferencesTabProps) {
  return <ProfilePreferences user={user} />;
}
