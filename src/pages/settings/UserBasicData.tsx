import { useEffect } from 'react';
import { User } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ProfileBasicData } from '@/pages/profile/ProfileBasicData';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

export default function UserBasicData() {
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);
  
  const user = userData?.user;

  const headerProps = {
    icon: User,
    title: 'Datos Básicos',
    subtitle: 'Información Personal',
    description: 'Administra tu información personal, foto de perfil y preferencias de cuenta.',
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando perfil...</div>
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
      <ProfileBasicData user={user} />
    </Layout>
  );
}
