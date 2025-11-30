import { ProfileOrganizations } from '@/pages/profile/ProfileOrganizations';

interface UserOrganizationsTabProps {
  user: any;
}

export default function UserOrganizationsTab({ user }: UserOrganizationsTabProps) {
  return <ProfileOrganizations user={user} />;
}
