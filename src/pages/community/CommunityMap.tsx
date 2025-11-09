import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { MapPin } from 'lucide-react';
import { InteractiveProjectsMap } from '@/components/community/InteractiveProjectsMap';

export default function CommunityMap() {
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('community');
  }, [setSidebarLevel]);

  const headerProps = {
    title: "Mapa de Proyectos",
    icon: MapPin,
    description: "Explora proyectos de la comunidad en todo el mundo",
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide="full" headerProps={headerProps}>
      <div className="h-[calc(100vh-180px)]">
        <InteractiveProjectsMap />
      </div>
    </Layout>
  );
}
