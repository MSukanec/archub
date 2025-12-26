import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
export default function Home() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  useEffect(() => {
    if (isLoading || !userData) return;
    // Todos los usuarios van al dashboard de organización
    setSidebarLevel('organization');
    navigate('/organization/dashboard', { replace: true });
  }, [userData, isLoading, navigate, setSidebarLevel]);
  return <LoadingSpinner fullScreen size="lg" />;
}
