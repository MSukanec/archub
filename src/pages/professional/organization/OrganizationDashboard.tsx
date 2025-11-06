import { useEffect } from "react";
import { 
  Building, 
  Clock, 
  Calendar, 
  Home, 
  Folder, 
  Plus
} from "lucide-react";
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import ProjectItemCard from '@/components/cards/ProjectItemCard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/ui-custom/stat-card';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from '@/hooks/use-projects';
import { useContacts } from '@/hooks/use-contacts';
import { useMovements } from '@/hooks/use-movements';
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from "@/hooks/use-current-user";
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrganizationDashboard() {
  const [, setLocation] = useLocation();
  const { openModal } = useGlobalModalStore();
  
  const { data: userData, isLoading } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: movements = [], isLoading: movementsLoading } = useMovements(organizationId, null);
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id;
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setShowActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  // Usar la organización actual del contexto, fallback a la del usuario
  const organization = userData?.organizations?.find(org => org.id === currentOrganizationId) || 
                      ((userData as UserData | undefined)?.organization ?? null);
  const currentTime = new Date();
  
  // Prepare projects with active flag
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }));
  
  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...projectsWithActive.filter(project => project.id === activeProjectId),
    ...projectsWithActive.filter(project => project.id !== activeProjectId)
  ] : projectsWithActive;

  // Mutation for selecting project
  const selectProjectMutation = useMutation({
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
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      // Update both stores: project context and navigation
      setSelectedProject(projectId, organizationId);
      setSidebarLevel('project');
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto se ha seleccionado correctamente"
      });
      
      // Navigate to project dashboard
      setLocation('/project/dashboard');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  });

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId);
  };

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
          <div className="text-muted-foreground">Cargando organización...</div>
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
    title: "Resumen de la Organización"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Welcome Section - Sin Card, directo en el fondo como Home */}
        <div className="space-y-2 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Organization Avatar */}
            <div className="flex-shrink-0">
              {organization?.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-accent"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent">
                  <Building className="w-8 h-8 text-accent" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">
                ¡Bienvenido a {organization?.name || 'tu organización'}!
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(currentTime, "HH:mm", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Grid - 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 1. Proyectos */}
          <StatCard 
            href="/organization/projects"
            onClick={() => setSidebarLevel('organization')}
            data-testid="stat-card-proyectos"
          >
            <StatCardTitle>Proyectos</StatCardTitle>
            <StatCardValue>
              {projectsLoading ? '...' : projects.length}
            </StatCardValue>
          </StatCard>

          {/* 2. Contactos */}
          <StatCard 
            href="/contacts"
            onClick={() => setSidebarLevel('organization')}
            data-testid="stat-card-contactos"
          >
            <StatCardTitle>Contactos</StatCardTitle>
            <StatCardValue>
              {contactsLoading ? '...' : contacts.length}
            </StatCardValue>
          </StatCard>

          {/* 3. Movimientos */}
          <StatCard 
            href="/finances/movements"
            onClick={() => setSidebarLevel('organization')}
            data-testid="stat-card-movimientos"
          >
            <StatCardTitle>Movimientos</StatCardTitle>
            <StatCardValue>
              {movementsLoading ? '...' : movements.length}
            </StatCardValue>
            <StatCardMeta>Total histórico</StatCardMeta>
          </StatCard>

          {/* 4. Actividad */}
          <StatCard 
            href="/finances/movements"
            onClick={() => setSidebarLevel('organization')}
            data-testid="stat-card-actividad"
          >
            <StatCardTitle>Actividad</StatCardTitle>
            <StatCardValue>
              {movementsLoading ? '...' : (() => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return movements.filter(m => new Date(m.created_at) >= startOfMonth).length;
              })()}
            </StatCardValue>
            <StatCardMeta>Este mes</StatCardMeta>
          </StatCard>
        </div>

        {/* Projects Section - Estilo minimalista */}
        <StatCard href="/projects">
          <StatCardTitle>Tus Proyectos</StatCardTitle>
          <StatCardContent>
            {isLoading || projectsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Cargando proyectos...</div>
              </div>
            ) : sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map((project) => (
                  <ProjectItemCard
                    key={project.id}
                    project={project}
                    onNavigateToProject={() => handleSelectProject(project.id)}
                    onEdit={() => handleEditProject(project)}
                    isActive={project.id === activeProjectId}
                    projectColor={project.color || 'var(--accent)'}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Folder className="w-12 h-12" />}
                title="No hay proyectos creados"
                description="Comienza creando tu primer proyecto para gestionar tu trabajo"
                action={
                  <Button
                    variant="default"
                    onClick={() => openModal('project', {})}
                    data-testid="button-nuevo-proyecto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proyecto
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