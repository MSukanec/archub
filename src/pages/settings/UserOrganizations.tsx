import { useEffect } from 'react';
import { Building } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ProfileOrganizations } from '@/pages/profile/ProfileOrganizations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

export default function UserOrganizations() {
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);
  
  const user = userData?.user;

  const headerProps = {
    icon: Building,
    title: 'Organizaciones',
    subtitle: 'Gestión de Organizaciones',
    description: 'Administra las organizaciones a las que perteneces y cambia entre ellas fácilmente.',
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando organizaciones...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Usuario no encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <ProfileOrganizations user={user} />
    </Layout>
  );
}
