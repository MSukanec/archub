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
      <div className="absolute inset-0 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Proyectos de la Comunidad
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Descubre proyectos de construcción alrededor del mundo. 
            Haz zoom para ver más detalles y haz clic en los marcadores para obtener información.
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          <InteractiveProjectsMap />
        </div>
      </div>
    </Layout>
  );
}
