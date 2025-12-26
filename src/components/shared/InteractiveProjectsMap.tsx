import { useQuery } from '@tanstack/react-query';
import { InteractiveMap, MapItem } from '@/components/shared/InteractiveMap';
interface ProjectLocation extends MapItem {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  organizationLogo?: string;
  color: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
}
export function InteractiveProjectsMap() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectLocation[]>({
    queryKey: ['/api/community/projects'],
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });
  return (
    <InteractiveMap<ProjectLocation>
      items={projects}
      isLoading={isLoading}
      error={error}
      emptyMessage="No hay proyectos con ubicación disponibles"
      renderPopup={(project) => (
        <div className="p-2">
          <div className="flex items-center gap-2 mb-1.5">
            {project.organizationLogo ? (
              <img 
                src={project.organizationLogo} 
                alt={project.organizationName}
                className="w-5 h-5 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2z"></path>
                </svg>
              </div>
            )}
            <span className="font-semibold text-xs text-gray-900">
              {project.organizationName}
            </span>
          </div>
          
          <div className="pl-7">
            <p className="text-xs text-gray-700 font-medium leading-snug">
              {project.name}
            </p>
            {project.city && (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {project.city}{project.state && `, ${project.state}`}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}
