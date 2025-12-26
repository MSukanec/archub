import { Building } from 'lucide-react';
import { DrawerLayout, DrawerHeader, DrawerBody } from '@/components/drawer';
import { OrganizationDetailContent } from './OrganizationDetailContent';
import { Badge } from '@/components/ui/badge';
interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan_id: string;
  created_by: string;
  settings: {
    is_founder?: boolean;
    [key: string]: any;
  } | null;
  plan: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  members_count: number;
  projects_count: number;
  last_seen_at: string | null;
}
export interface OrganizationDetailDrawerProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}
export function OrganizationDetailDrawer({
  organization,
  isOpen,
  onClose,
}: OrganizationDetailDrawerProps) {
  if (!organization) return null;
  
  const planName = organization.plan?.name || 'Sin plan';
  const getPlanBgColor = (name: string) => {
    if (name === 'Free') return 'bg-[var(--plan-free-bg)]';
    if (name === 'Pro') return 'bg-[var(--plan-pro-bg)]';
    if (name === 'Teams') return 'bg-[var(--plan-teams-bg)]';
    return 'bg-muted';
  };
  
  return (
    <DrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      ariaLabel={`Detalles de ${organization.name}`}
      headerContent={
        <DrawerHeader
          title={organization.name}
          description={organization.creator?.email || 'Sin creador'}
          icon={Building}
          badge={
            <Badge className={`${getPlanBgColor(planName)} text-white text-xs`}>
              {planName}
            </Badge>
          }
        />
      }
    >
      <DrawerBody noPadding>
        <OrganizationDetailContent
          organization={organization}
          onSuccess={onClose}
          hideActions
        />
      </DrawerBody>
    </DrawerLayout>
  );
}
export default OrganizationDetailDrawer;
