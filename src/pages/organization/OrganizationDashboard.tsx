import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Building, 
  Clock, 
  Calendar, 
  Home, 
  Folder, 
  Plus,
  ArrowRight,
  Users,
  FileText,
  Users2,
  Camera,
  Loader2
} from "lucide-react";
import { useLocation } from 'wouter';

import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { useGlobalModalStore } from '@/components/modal';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/dashboard';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects, ProjectItemCard, updateProjectLastActive } from '@/features/projects';
import { useContacts } from '@/features/contacts';
import { useSiteLogs } from '@/features/sitelog/hooks/use-site-logs';
import { useUserOrganizationPreferences, USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import type { UserData } from "@/hooks/use-current-user";
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { uploadOrgLogo } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrganizationInitials } from '@/utils/initials';
import { cn } from '@/lib/utils';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';

export default function OrganizationDashboard() {
  const [, setLocation] = useLocation();
  const { openModal } = useGlobalModalStore();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const { data: userData, isLoading } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const userId = userData?.user?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId);
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(undefined, organizationId);
  const { data: userOrgPrefs } = useUserOrganizationPreferences(userId, organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id;
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { setShowActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  const organization = userData?.organizations?.find(org => org.id === currentOrganizationId) || 
                      ((userData as UserData | undefined)?.organization ?? null);
  const currentTime = new Date();

  const preferencesQueryKey = userId && organizationId 
    ? USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userId, organizationId)
    : ['user-org-preferences-placeholder'];

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

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;
    e.target.value = '';
    uploadLogo(file);
  }, [organizationId, uploadLogo]);
  
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }));
  
  const sortedProjects = activeProjectId ? [
    ...projectsWithActive.filter(project => project.id === activeProjectId),
    ...projectsWithActive.filter(project => project.id !== activeProjectId)
  ] : projectsWithActive;

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
      setSidebarLevel('project');
      
      updateProjectLastActive(projectId, organizationId!).catch(err => 
        console.error('Error updating project last_active_at:', err)
      );
      
      setLocation('/project/dashboard');
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

  const handleSelectProject = useCallback((projectId: string) => {
    selectProject(projectId);
  }, [selectProject]);

  const handleEditProject = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true });
  };

  // Dashboard no debe mostrar action bar
  useEffect(() => {
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [isMobile, setShowActionBar]);

  // Establecer nivel del sidebar a organización
  useEffect(() => {
    // Only set to 'organization' if not in 'general' mode (respects user's hub selection)
    if (sidebarLevel !== 'general') {
      setSidebarLevel('organization');
    }
  }, [setSidebarLevel, sidebarLevel]);

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Organización no encontrada</div>
        </div>
      </Layout>
    );
  }

  const headerProps = {
    icon: Home,
    title: "Visión General",
    description: "Vista general de tu organización, proyectos y actividad reciente.",
    organizationId: organizationId,
    showMembers: true
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Welcome Section - Sin Card, directo en el fondo como Home */}
        <div className="space-y-2 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Organization Avatar - Clickeable para subir logo */}
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
                      alt={organization?.name || 'Organización'}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-xl font-bold bg-accent text-white">
                    {getOrganizationInitials(organization?.name || '')}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay con icono de cámara al hacer hover */}
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

              {/* Hidden file input */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isLogoUploading}
                className="hidden"
                aria-label="Cargar logo de organización"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-foreground">
                Hola, {userData?.user_data?.first_name || userData?.user?.full_name || 'Usuario'}
              </h2>
              <p className="text-lg text-muted-foreground mt-1">
                Estás en {organization?.name || 'tu organización'}
              </p>
            </div>
          </div>
        </div>

        {/* KPIs Section - 4 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Proyectos Activos */}
          <StatCard href="/organization/projects" data-testid="stat-card-proyectos-activos">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <StatCardTitle>Proyectos Activos</StatCardTitle>
                <StatCardValue className="mt-2">
                  {projectsLoading ? '-' : projects.filter(p => p.status === 'active').length}
                </StatCardValue>
                <StatCardMeta>
                  {projectsLoading ? 'Cargando...' : `de ${projects.length} totales`}
                </StatCardMeta>
              </div>
              <Folder className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
            </div>
          </StatCard>

          {/* 2. Contactos */}
          <StatCard href="/contacts" data-testid="stat-card-contactos">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <StatCardTitle>Contactos</StatCardTitle>
                <StatCardValue className="mt-2">
                  {contactsLoading ? '-' : contacts.length}
                </StatCardValue>
                <StatCardMeta>
                  {contactsLoading ? 'Cargando...' : 'Personal y clientes'}
                </StatCardMeta>
              </div>
              <Users className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
            </div>
          </StatCard>

          {/* 3. Bitácoras */}
          <StatCard data-testid="stat-card-bitacoras-org">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <StatCardTitle>Bitácoras</StatCardTitle>
                <StatCardValue className="mt-2">
                  {siteLogsLoading ? '-' : siteLogs.length}
                </StatCardValue>
                <StatCardMeta>
                  {siteLogsLoading ? 'Cargando...' : 'Registros totales'}
                </StatCardMeta>
              </div>
              <FileText className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
            </div>
          </StatCard>

          {/* 4. Equipo */}
          <StatCard data-testid="stat-card-equipo" className="opacity-75 cursor-default hover:shadow-none">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <StatCardTitle>Equipo</StatCardTitle>
                <StatCardValue className="mt-2">
                  {contactsLoading ? '-' : contacts.filter((c: any) => c.contact_type === 'staff' || c.contact_type === 'personnel').length}
                </StatCardValue>
                <StatCardMeta>
                  {contactsLoading ? 'Cargando...' : 'Miembros activos'}
                </StatCardMeta>
              </div>
              <Users2 className="w-5 h-5 text-muted-foreground opacity-40 mt-1" />
            </div>
          </StatCard>
        </div>

        {/* Projects Section - Estilo minimalista */}
        <StatCard href="/organization/projects">
          <StatCardTitle>Proyectos Activos</StatCardTitle>
          <StatCardContent>
            {isLoading || projectsLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : sortedProjects.filter(p => p.status === 'active').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedProjects.filter(p => p.status === 'active').map((project) => (
                  <ProjectItemCard
                    key={project.id}
                    project={project}
                    onClick={() => handleSelectProject(project.id)}
                    onNavigateToProject={() => handleSelectProject(project.id)}
                    onEdit={() => handleEditProject(project)}
                    isActive={project.id === activeProjectId}
                    projectColor={(project as any).use_custom_color && (project as any).custom_color_hex 
                      ? (project as any).custom_color_hex 
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
                    onClick={() => {
                      setSidebarLevel('organization');
                      setLocation('/organization/projects');
                    }}
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
      </div>
    </Layout>
  );
}
