import { useLocation } from "wouter";
import { FileText, ArrowRight, Building2 } from "lucide-react";
import { useProjectContext } from '@/stores/projectContext';
import { useProject } from '@/features/projects/hooks/use-project';
import { useSiteLogs } from '@/features/sitelog/hooks/use-site-logs';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery } from '@tanstack/react-query';
import { getProjectImageUrlFromData } from '@/lib/storage/uploadProjectImage';
import { projectsKeys } from '@/core/query-keys';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/dashboard';
import { Badge } from '@/components/ui/badge';

export function ProjectVisionGeneralView() {
  const [, navigate] = useLocation();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  
  const { data: currentProject, isLoading: projectLoading } = useProject(selectedProjectId || undefined);
  const { data: siteLogs = [] } = useSiteLogs(selectedProjectId || undefined, organizationId || undefined);

  const { data: projectImageUrl } = useQuery({
    queryKey: projectsKeys.image(currentProject?.id),
    queryFn: () => getProjectImageUrlFromData(currentProject!.project_data!),
    enabled: !!currentProject?.project_data?.image_bucket && !!currentProject?.project_data?.image_path,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 25 * 60 * 1000,
  });

  // Render: No project selected
  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un Proyecto</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un proyecto desde el selector superior para ver su dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Render: Loading
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando proyecto...</div>
      </div>
    );
  }

  // Render: Not found
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Proyecto no encontrado</div>
      </div>
    );
  }

  const projectColor = currentProject?.color || 'var(--accent)';

  // Hero Section
  const heroSection = (
    <div 
      className="relative h-[65vh] md:h-[48vh] overflow-hidden w-full"
      data-testid="hero-project"
    >
      {projectImageUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-reduce:bg-scroll"
            style={{
              backgroundImage: `url(${projectImageUrl})`,
              backgroundPosition: 'center center'
            }}
          />
          <div 
            className="absolute inset-0 bg-gradient-to-b"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.4), var(--layout-bg))'
            }}
          />
        </>
      ) : (
        <div 
          className="absolute inset-0 bg-gradient-to-br"
          style={{
            backgroundImage: `linear-gradient(135deg, ${projectColor}30, ${projectColor}10)`
          }}
        />
      )}

      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8">
        <div className="max-w-3xl">
          <h1 
            className="text-xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 md:mb-3 tracking-tight !text-white line-clamp-2" 
            data-testid="text-project-name"
          >
            {currentProject.name}
          </h1>
          
          <div className="flex flex-wrap gap-2">
            {currentProject.project_data?.project_type?.name && (
              <Badge 
                className="text-xs font-medium px-2.5 py-1"
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
                className="text-xs font-medium px-2.5 py-1"
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
                className="text-xs font-medium px-2.5 py-1"
                style={{ 
                  backgroundColor: `${projectColor}40`,
                  color: projectColor,
                  borderColor: projectColor,
                  border: '1px solid'
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

  // Main Content
  const mainContent = (
    <div className="space-y-6 project-breathing-bg px-4 sm:px-6 md:px-12 py-6 md:py-12">
      <div>
        <StatCard 
          data-testid="stat-card-bitacoras"
          className="w-full cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={() => navigate('/construction/logs')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <StatCardTitle>Bitácoras</StatCardTitle>
              <StatCardValue className="mt-2">{siteLogs.length}</StatCardValue>
              <StatCardMeta>Últimas 3 entradas</StatCardMeta>
            </div>
            <div className="flex flex-col items-end gap-2">
              <FileText className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
              {siteLogs.length > 0 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-60" />
              )}
            </div>
          </div>
          {siteLogs.length > 0 && (
            <StatCardContent>
              <div className="space-y-2.5">
                {siteLogs.slice(0, 3).map((log: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="text-xs text-muted-foreground space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {formatDistanceToNow(new Date(log.log_date || log.created_at), { 
                          addSuffix: true,
                          locale: es 
                        })}
                      </span>
                      {log.site_log_type?.name && (
                        <Badge 
                          variant="neutral" 
                          className="text-xs py-0 px-1.5 h-fit"
                        >
                          {log.site_log_type.name}
                        </Badge>
                      )}
                    </div>
                    {log.comments && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        "{log.comments}"
                      </div>
                    )}
                    {log.creator?.user?.full_name && (
                      <div className="text-xs text-muted-foreground/70">
                        por {log.creator.user.full_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </StatCardContent>
          )}
          {siteLogs.length === 0 && (
            <StatCardContent>
              <div className="text-xs text-muted-foreground text-center py-2">
                Haz clic para crear tu primera entrada
              </div>
            </StatCardContent>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-mano-obra">
          <StatCardTitle showArrow={false}>Mano de Obra</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-materiales">
          <StatCardTitle showArrow={false}>Materiales</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-indirectos">
          <StatCardTitle showArrow={false}>Indirectos</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-subcontratos">
          <StatCardTitle showArrow={false}>Subcontratos</StatCardTitle>
          <StatCardValue>-</StatCardValue>
          <StatCardMeta>Próximamente</StatCardMeta>
        </StatCard>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      {heroSection}
      {mainContent}
    </div>
  );
}
