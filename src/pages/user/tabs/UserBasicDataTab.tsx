import { ProfileBasicData } from '@/pages/profile/ProfileBasicData';

interface UserBasicDataTabProps {
  user: any;
}

export default function UserBasicDataTab({ user }: UserBasicDataTabProps) {
  return <ProfileBasicData user={user} />;
}
