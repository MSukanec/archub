import { useEffect } from "react";
import { 
  Building2, 
  Clock, 
  Calendar, 
  Users,
  Calculator,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjects } from '@/hooks/use-projects';
import { useCurrentUser } from '@/hooks/use-current-user';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';

export default function ProjectDashboard() {
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  
  const currentTime = new Date();
  
  // Get current project
  const currentProject = projects.find(p => p.id === selectedProjectId);

  // DEBUG: Log to diagnose the issue
  console.log('=== ProjectDashboard DEBUG ===');
  console.log('selectedProjectId:', selectedProjectId);
  console.log('organizationId:', organizationId);
  console.log('projectsLoading:', projectsLoading);
  console.log('projects:', projects);
  console.log('currentProject:', currentProject);

  // Set sidebar level to project
  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('project');
    }
  }, [setSidebarLevel, sidebarLevel]);

  // Empty state if no project selected
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

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando proyecto...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Proyecto no encontrado</div>
      </div>
    );
  }

  // Project color or default accent
  const projectColor = currentProject.color || 'var(--accent)';

  return (
    <div className="space-y-6 project-breathing-bg">
      {/* Welcome Section - Similar to Organization Dashboard */}
      <div className="space-y-2 pb-6 border-b border-border accent-transition">
        <div className="flex items-center gap-4">
          {/* Project Avatar */}
          <div className="flex-shrink-0">
            {currentProject.project_data?.project_image_url ? (
              <img 
                src={currentProject.project_data.project_image_url} 
                alt={currentProject.name}
                className="w-16 h-16 rounded-full object-cover border-2 accent-transition accent-glow"
                style={{ borderColor: projectColor }}
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 accent-transition accent-glow"
                style={{ 
                  backgroundColor: `${projectColor}15`,
                  borderColor: projectColor
                }}
              >
                <Building2 className="w-8 h-8 accent-transition" style={{ color: projectColor }} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-semibold text-foreground">
                {currentProject.name}
              </h2>
              {currentProject.status && (
                <Badge 
                  variant={currentProject.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {currentProject.status === 'active' ? 'Activo' : currentProject.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

      {/* Cómputo y Presupuesto Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent" />
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Cómputo y Presupuesto
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Próximamente
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Presupuesto Total</p>
              <p className="text-2xl font-bold text-foreground">-</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ejecutado</p>
              <p className="text-2xl font-bold text-foreground">-</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">% Avance</p>
              <p className="text-2xl font-bold text-foreground">-</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            El módulo de Cómputo y Presupuesto estará disponible próximamente con análisis detallado de costos y avance financiero.
          </p>
        </CardContent>
      </Card>

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

      {/* Bitácora y Clientes Grid - 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bitácora Card */}
        <StatCard 
          href="/construction/logs"
          onClick={() => setSidebarLevel('project')}
          data-testid="stat-card-bitacora"
        >
          <StatCardContent>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Bitácora de Obra
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entradas totales</span>
                <span className="text-lg font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última entrada</span>
                <span className="text-lg font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendientes</span>
                <span className="text-lg font-semibold">-</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Registra y consulta todas las actividades diarias del proyecto.
            </p>
          </StatCardContent>
        </StatCard>

        {/* Clientes Card */}
        <StatCard 
          href="/clients"
          onClick={() => setSidebarLevel('general')}
          data-testid="stat-card-clientes"
        >
          <StatCardContent>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-accent" />
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Clientes del Proyecto
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clientes activos</span>
                <span className="text-lg font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pagos recibidos</span>
                <span className="text-lg font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendiente cobro</span>
                <span className="text-lg font-semibold">-</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Gestiona la información y pagos de tus clientes.
            </p>
          </StatCardContent>
        </StatCard>
      </div>

    </div>
  );
}
