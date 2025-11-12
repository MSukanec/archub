import { useEffect } from 'react';
import { Settings } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ProfilePreferences } from '@/pages/profile/ProfilePreferences';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

export default function UserPreferences() {
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);
  
  const user = userData?.user;

  const headerProps = {
    icon: Settings,
    title: 'Preferencias',
    subtitle: 'Configuración de Aplicación',
    description: 'Personaliza tu experiencia con ajustes de tema, diseño y comportamiento de la interfaz.',
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando preferencias...</div>
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
      <ProfilePreferences user={user} />
    </Layout>
  );
}
