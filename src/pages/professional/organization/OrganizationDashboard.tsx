import { useEffect } from "react";
import { 
  Building, 
  Clock, 
  Calendar, 
  Home, 
  Folder, 
  Plus, 
  Users, 
  DollarSign, 
  Calculator,
  TrendingUp,
  ArrowRight 
} from "lucide-react";
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import ProjectItem from '@/components/ui-custom/general/ProjectItem';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from '@/hooks/use-projects';
import { useContacts } from '@/hooks/use-contacts';
import { useMovements } from '@/hooks/use-movements';
import { useMovementKPIs } from '@/hooks/use-movement-kpis';
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
import { CapitalChart } from '@/components/charts/organization/dashboard/CapitalChart';
import { useState } from 'react';

type Period = 'Semana' | 'Mes' | 'Trimestre' | 'Año';

export default function OrganizationDashboard() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Trimestre');
  const { openModal } = useGlobalModalStore();
  
  const { data: userData, isLoading } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: movements = [], isLoading: movementsLoading } = useMovements(organizationId, null);
  const { organizationBalances, isLoading: kpisLoading } = useMovementKPIs(organizationId);
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
  
  // Obtener el balance principal (primera moneda con más movimientos)
  const primaryBalance = organizationBalances && organizationBalances.length > 0 
    ? organizationBalances[0] 
    : null;
  
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

        {/* Layout: Capital (3/4) + Cards KPI (1/4) */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Sección de Capital - 3/4 del ancho */}
          <div className="col-span-3 relative group">
            {/* Header */}
            <div className="flex flex-row items-start justify-between mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p 
                    className="text-xs font-normal text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => {
                      setSidebarLevel('organization');
                      setLocation('/finances/capital');
                    }}
                  >
                    Capital
                  </p>
                  <button
                    onClick={() => {
                      setSidebarLevel('organization');
                      setLocation('/finances/capital');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Total histórico - debajo del título */}
                <div className="text-5xl font-bold text-foreground tracking-tight leading-none">
                  ${primaryBalance?.balance.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0.00'}
                </div>
                
                {/* Ingresos y Egresos - debajo del monto total */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    I: <span className="text-green-600 font-medium">
                      ${primaryBalance?.positiveTotal.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) || '0.00'}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    E: <span className="text-red-600 font-medium">
                      ${primaryBalance?.negativeTotal.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) || '0.00'}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Period selector buttons */}
              <div className="flex items-center gap-2">
                {(['Semana', 'Mes', 'Trimestre', 'Año'] as Period[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedPeriod === period
                        ? 'bg-[hsl(var(--accent-hsl))] text-background font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`button-period-${period.toLowerCase()}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Gráfico */}
            <CapitalChart 
              movements={movements} 
              primaryCurrencyCode={primaryBalance?.currencyCode || '$'}
              selectedPeriod={selectedPeriod}
            />
          </div>

          {/* Cards KPI - 1/4 del ancho */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* 1. Proyectos */}
            <Card 
              className="relative group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSidebarLevel('organization');
                setLocation('/organization/projects');
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Proyectos</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-5xl font-bold text-foreground tracking-tight">
                  {projectsLoading ? '...' : projects.length}
                </div>
              </CardContent>
            </Card>

            {/* 2. Contactos */}
            <Card 
              className="relative group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSidebarLevel('organization');
                setLocation('/contacts');
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Contactos</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-5xl font-bold text-foreground tracking-tight">
                  {contactsLoading ? '...' : contacts.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Projects Section - Estilo minimalista */}
        <Card className="relative group">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Tus Proyectos</p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading || projectsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Cargando proyectos...</div>
              </div>
            ) : sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onClick={() => handleSelectProject(project.id)}
                    onEdit={() => handleEditProject(project)}
                    isActive={project.id === activeProjectId}
                    projectColor={project.color || 'var(--accent)'}
                    data-testid={`project-item-${project.id}`}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}