import { useEffect } from "react";
import { HeroLayout } from "@/layouts";
import { 
  Building2
} from "lucide-react";

import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjects } from '@/features/projects';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery } from '@tanstack/react-query';
import { getProjectImageUrlFromData } from '@/lib/storage/uploadProjectImage';

import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';

export default function Project() {
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  
  // Get current project
  const currentProject = projects.find(p => p.id === selectedProjectId);

  // Generate project image URL on-demand with React Query
  const { data: projectImageUrl } = useQuery({
    queryKey: ['project-image', currentProject?.id, currentProject?.project_data?.image_bucket, currentProject?.project_data?.image_path],
    queryFn: () => getProjectImageUrlFromData(currentProject!.project_data!),
    enabled: !!currentProject?.project_data?.image_bucket && !!currentProject?.project_data?.image_path,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 25 * 60 * 1000,
  });

  // Set sidebar context
  useEffect(() => {
    setSidebarContext('project');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('project');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  // Project color
  const projectColor = currentProject?.color || 'var(--accent)';

  // Hero section
  const heroSection = currentProject && (
    <div 
      className="relative h-1/2 md:h-[48vh] overflow-hidden w-full"
      data-testid="hero-project"
    >
      {/* Background Image */}
      {projectImageUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-reduce:bg-scroll"
            style={{
              backgroundImage: `url(${projectImageUrl})`,
              backgroundPosition: 'center center'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />
        </>
      ) : (
        <div 
          className="absolute inset-0 bg-gradient-to-br"
          style={{
            backgroundImage: `linear-gradient(135deg, ${projectColor}30, ${projectColor}10)`
          }}
        />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8">
        <div className="max-w-3xl">
          {/* Project Name */}
          <h1 
            className="text-lg sm:text-2xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-3 tracking-tight !text-white line-clamp-2" 
            data-testid="text-project-name"
          >
            {currentProject.name}
          </h1>
          
          {/* Badges - Type, Modality, Status */}
          <div className="flex flex-wrap gap-2">
            {currentProject.project_data?.project_type?.name && (
              <Badge 
                className="text-[7px] sm:text-[8px] md:text-[9px] font-medium px-2 py-0.5"
                style={{ 
                  backgroundColor: `${projectColor}40`,
                  color: projectColor,
                  borderColor: projectColor,
                  border: '1px solid'
                }}
                data-testid="badge-project-type"
              >
                {currentProject.project_data.project_type.name}
              </Badge>
            )}
            
            {currentProject.project_data?.project_modality?.name && (
              <Badge 
                className="text-[7px] sm:text-[8px] md:text-[9px] font-medium px-2 py-0.5"
                style={{ 
                  backgroundColor: `${projectColor}40`,
                  color: projectColor,
                  borderColor: projectColor,
                  border: '1px solid'
                }}
                data-testid="badge-project-modality"
              >
                {currentProject.project_data.project_modality.name}
              </Badge>
            )}
            
            {currentProject.status && (
              <Badge 
                className="text-[7px] sm:text-[8px] md:text-[9px] font-medium px-2 py-0.5"
                style={{ 
                  backgroundColor: currentProject.status === 'active' ? 'var(--accent)' : '#6b7280',
                  color: 'white'
                }}
                data-testid="badge-project-status"
              >
                {currentProject.status === 'active' ? 'En Proceso' : currentProject.status}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Main content - KPIs
  const mainContent = (
    <div className="space-y-6 project-breathing-bg">
      {/* KPIs Grid - 4 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Mano de Obra */}
        <StatCard 
          data-testid="stat-card-mano-obra"
        >
          <StatCardTitle showArrow={false}>Mano de Obra</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        {/* 2. Materiales */}
        <StatCard 
          data-testid="stat-card-materiales"
        >
          <StatCardTitle showArrow={false}>Materiales</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        {/* 3. Indirectos */}
        <StatCard 
          data-testid="stat-card-indirectos"
        >
          <StatCardTitle showArrow={false}>Indirectos</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        {/* 4. Subcontratos */}
        <StatCard 
          data-testid="stat-card-subcontratos"
        >
          <StatCardTitle showArrow={false}>Subcontratos</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>
      </div>
    </div>
  );

  // Empty state if no project selected
  if (!selectedProjectId) {
    return (
      <HeroLayout hideAIChat>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un Proyecto</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un proyecto desde el selector superior para ver su dashboard.
            </p>
          </div>
        </div>
      </HeroLayout>
    );
  }

  if (projectsLoading) {
    return (
      <HeroLayout hideAIChat>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando proyecto...</div>
        </div>
      </HeroLayout>
    );
  }

  if (!currentProject) {
    return (
      <HeroLayout hideAIChat>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Proyecto no encontrado</div>
        </div>
      </HeroLayout>
    );
  }

  return (
    <HeroLayout 
      heroContent={heroSection}
      mainContent={mainContent}
      hideAIChat={true}
    />
  );
}
