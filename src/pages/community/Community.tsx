import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { MapPin } from 'lucide-react';
import { InteractiveProjectsMap } from '@/components/community/InteractiveProjectsMap';

export default function Community() {
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
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Proyectos de la Comunidad
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Descubre proyectos de construcción alrededor del mundo. 
              Haz zoom para ver más detalles y haz clic en los marcadores para obtener información.
            </p>
          </div>
          
          <InteractiveProjectsMap />
        </div>
      </div>
    </Layout>
  );
}
