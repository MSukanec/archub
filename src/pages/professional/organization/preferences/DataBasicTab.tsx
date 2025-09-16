import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { DataBasic } from './DataBasic';

interface DataBasicTabProps {
  // No additional props needed as DataBasic gets organization from useCurrentUser
}

export function DataBasicTab({}: DataBasicTabProps) {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const currentOrganization = userData?.organization;

  return <DataBasic organization={currentOrganization} />;
}