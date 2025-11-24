import { useEffect } from "react";
import { HeroLayout } from "@/layouts";
import { 
  Building2, 
  Clock, 
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  
  const currentTime = new Date();
  
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
      className="relative h-[200px] sm:h-[250px] md:h-80 overflow-hidden w-full"
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
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-12">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-3 sm:mb-6">
            {currentProject.status && (
              <Badge 
                style={{ 
                  backgroundColor: currentProject.status === 'active' ? 'var(--accent)' : 'gray',
                  color: 'white'
                }}
                className="text-[9px] sm:text-[10px] md:text-xs font-medium uppercase px-3 sm:px-4 py-1.5 sm:py-2"
                data-testid="badge-project-status"
              >
                {currentProject.status === 'active' ? 'En Proceso' : currentProject.status}
              </Badge>
            )}
          </div>
          
          {/* Project Name */}
          <h1 
            className="text-lg sm:text-2xl md:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 tracking-tight !text-white line-clamp-2" 
            data-testid="text-project-name"
          >
            {currentProject.name}
          </h1>
          
          {/* Time and Date */}
          <div className="flex items-center gap-4 text-xs sm:text-sm md:text-base text-[rgb(220,220,220)]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{format(currentTime, "HH:mm", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="capitalize line-clamp-1">{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</span>
            </div>
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
