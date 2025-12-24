import { useRef, useEffect, useState, useCallback } from 'react';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects, updateProjectLastActive } from '@/features/projects';
import { useContacts } from '@/features/contacts';
import { useSiteLogs } from '@/features/sitelog/hooks/use-site-logs';
import { useUserOrganizationPreferences } from '@/features/organization';
import { userOrgPreferencesKeys } from '@/core/query-keys';
import { useProjectContext } from '@/stores/projectContext';
import { supabase } from '@/lib/supabase';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { uploadOrgLogo } from '@/lib/storage';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import type { UserData } from "@/hooks/use-current-user";
import { Folder, ArrowRight, Camera, Loader2, Users, FileText, Users2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/dashboard';
import { ProjectItemCard } from '@/features/projects';
import { getOrganizationInitials } from '@/utils/initials';
import { cn } from '@/lib/utils';

interface OrganizationDashboardViewProps {
  onProjectSelected?: (projectId: string) => void;
  onNavigateToProjects?: () => void;
}

// Internal component: WelcomePanel
function WelcomePanel({ 
  userName, 
  organizationName, 
  logoUrl, 
  isLogoUploading,
  onLogoUpload 
}: {
  userName: string;
  organizationName: string;
  logoUrl: string | null;
  isLogoUploading: boolean;
  onLogoUpload: (file: File) => void;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      onLogoUpload(file);
    }
  };

  return (
    <div className="space-y-2 pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 relative group">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={isLogoUploading}
            className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full"
            title="Cambiar logo de la organización"
            data-testid="button-upload-org-logo"
          >
            <Avatar className="h-16 w-16 border-2 border-accent">
              {logoUrl && logoUrl.trim() !== '' && (
                <AvatarImage 
                  src={logoUrl} 
                  alt={organizationName || 'Organización'}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-xl font-bold bg-accent text-white">
                {getOrganizationInitials(organizationName || '')}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "absolute inset-0 rounded-full flex items-center justify-center transition-all",
              "bg-black/50 opacity-0 group-hover:opacity-100",
              isLogoUploading && "opacity-100"
            )}>
              {isLogoUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLogoUploading}
            className="hidden"
            aria-label="Cargar logo de organización"
          />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-foreground">
            Hola, {userName}
          </h2>
          <p className="text-lg text-muted-foreground mt-1">
            Estás en {organizationName || 'tu organización'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Internal component: StatsPanel
function StatsPanel({
  projectsCount,
  activeProjectsCount,
  contactsCount,
  siteLogsCount,
  teamCount,
  isLoading,
}: {
  projectsCount: number;
  activeProjectsCount: number;
  contactsCount: number;
  siteLogsCount: number;
  teamCount: number;
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard href="/organization/projects" data-testid="stat-card-proyectos-activos">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Proyectos Activos</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : activeProjectsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : `de ${projectsCount} totales`}
            </StatCardMeta>
          </div>
          <Folder className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard href="/contacts" data-testid="stat-card-contactos">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Contactos</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : contactsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Personal y clientes'}
            </StatCardMeta>
          </div>
          <Users className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard data-testid="stat-card-bitacoras-org">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Bitácoras</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : siteLogsCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Registros totales'}
            </StatCardMeta>
          </div>
          <FileText className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>

      <StatCard data-testid="stat-card-equipo" className="opacity-75 cursor-default hover:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <StatCardTitle>Equipo</StatCardTitle>
            <StatCardValue className="mt-2">
              {isLoading ? '-' : teamCount}
            </StatCardValue>
            <StatCardMeta>
              {isLoading ? 'Cargando...' : 'Miembros activos'}
            </StatCardMeta>
          </div>
          <Users2 className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
        </div>
      </StatCard>
    </div>
  );
}

// Internal component: ProjectsPanel
function ProjectsPanel({
  projects,
  activeProjectId,
  isLoading,
  onSelectProject,
  onEditProject,
  onNavigateToProjects,
}: {
  projects: any[];
  activeProjectId: string | null | undefined;
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: any) => void;
  onNavigateToProjects: () => void;
}) {
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }));
  
  const sortedProjects = activeProjectId ? [
    ...projectsWithActive.filter(project => project.id === activeProjectId),
    ...projectsWithActive.filter(project => project.id !== activeProjectId)
  ] : projectsWithActive;

  const activeProjects = sortedProjects.filter(p => p.status === 'active');

  return (
    <StatCard href="/organization/projects">
      <StatCardTitle>Proyectos Activos</StatCardTitle>
      <StatCardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeProjects.map((project) => (
              <ProjectItemCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project.id)}
                onNavigateToProject={() => onSelectProject(project.id)}
                onEdit={() => onEditProject(project)}
                isActive={project.id === activeProjectId}
                projectColor={project.use_custom_color && project.custom_color_hex 
                  ? project.custom_color_hex 
                  : project.color || 'var(--accent)'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Folder className="w-12 h-12" />}
            title="No hay proyectos en proceso"
            description="Ve a la página de gestión de proyectos para cambiar el estado de un proyecto"
            action={
              <Button
                variant="default"
                onClick={onNavigateToProjects}
                data-testid="button-ir-gestion-proyectos"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Ir a Gestión de Proyectos
              </Button>
            }
          />
        )}
      </StatCardContent>
    </StatCard>
  );
}

// Main View Component
export function OrganizationDashboardView({ 
  onProjectSelected,
  onNavigateToProjects 
}: OrganizationDashboardViewProps) {
  const { openModal } = useGlobalModalStore();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const { data: userData, isLoading } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const userId = userData?.user?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId);
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(undefined, organizationId);
  const { data: userOrgPrefs } = useUserOrganizationPreferences(userId, organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id;
  
  const organization = userData?.organizations?.find(org => org.id === currentOrganizationId) || 
                      ((userData as UserData | undefined)?.organization ?? null);

  const preferencesQueryKey = userOrgPreferencesKeys.detail(userId!, organizationId!);

  useEffect(() => {
    if (organization) {
      if ((organization as any).image_bucket && (organization as any).image_path) {
        const { data } = supabase.storage
          .from((organization as any).image_bucket)
          .getPublicUrl((organization as any).image_path);
        setLogoUrl(data.publicUrl);
      } else if ((organization as any).logo_url) {
        setLogoUrl((organization as any).logo_url);
      } else {
        setLogoUrl(null);
      }
    }
  }, [organization]);

  const { mutate: uploadLogo, isPending: isLogoUploading } = useOptimisticMutation({
    mutationFn: async (file: File) => {
      if (!organizationId) throw new Error('Organization ID required');
      
      const result = await uploadOrgLogo(file, organizationId);
      
      const { error } = await supabase
        .from('organizations')
        .update({
          image_bucket: result.bucket,
          image_path: result.file_path
        })
        .eq('id', organizationId);
      
      if (error) throw error;
      
      if (result.file_url) {
        setLogoUrl(result.file_url);
      }
      
      return result;
    },
    queryKey: ['current-user'],
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: "Logo actualizado correctamente",
    onErrorMessage: "No se pudo subir el logo",
    additionalQueryKeys: [['organizations', organizationId]],
  });

  const { mutate: selectProject } = useOptimisticMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !organizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: organizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        });
      
      if (error) throw error;
      
      setSelectedProject(projectId, organizationId);
      
      updateProjectLastActive(projectId, organizationId!).catch(err => 
        console.error('Error updating project last_active_at:', err)
      );
      
      onProjectSelected?.(projectId);
      return projectId;
    },
    queryKey: preferencesQueryKey,
    optimisticUpdate: (oldData: any, projectId: string) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        last_project_id: projectId,
        updated_at: new Date().toISOString()
      };
    },
    onSuccessMessage: "Proyecto seleccionado",
    onErrorMessage: "No se pudo seleccionar el proyecto",
    additionalQueryKeys: [['current-user'], ['active-projects'], ['projects']],
  });

  const handleLogoUpload = useCallback((file: File) => {
    uploadLogo(file);
  }, [uploadLogo]);

  const handleSelectProject = useCallback((projectId: string) => {
    selectProject(projectId);
  }, [selectProject]);

  const handleEditProject = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Organización no encontrada</div>
      </div>
    );
  }

  const userName = userData?.user_data?.first_name || userData?.user?.full_name || 'Usuario';
  const teamCount = contacts.filter((c: any) => c.contact_type === 'staff' || c.contact_type === 'personnel').length;
  const dataLoading = projectsLoading || contactsLoading || siteLogsLoading;

  return (
    <div className="space-y-6">
      <WelcomePanel
        userName={userName}
        organizationName={organization?.name || ''}
        logoUrl={logoUrl}
        isLogoUploading={isLogoUploading}
        onLogoUpload={handleLogoUpload}
      />

      <StatsPanel
        projectsCount={projects.length}
        activeProjectsCount={projects.filter(p => p.status === 'active').length}
        contactsCount={contacts.length}
        siteLogsCount={siteLogs.length}
        teamCount={teamCount}
        isLoading={dataLoading}
      />

      <ProjectsPanel
        projects={projects as any}
        activeProjectId={activeProjectId}
        isLoading={isLoading || projectsLoading}
        onSelectProject={handleSelectProject}
        onEditProject={handleEditProject}
        onNavigateToProjects={onNavigateToProjects || (() => {})}
      />
    </div>
  );
}
