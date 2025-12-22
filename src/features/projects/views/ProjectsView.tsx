import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjects, useProjectsCount } from '@/features/projects';
import { useGlobalModalStore } from '@/components/modal';
import { PlanRestricted } from '@/features/users';
import { FEATURE_IMAGES } from '@/constants/images';
import ProjectActivesTab from '@/pages/projects/ProjectActivesTab';
import ProjectListTab from '@/pages/projects/ProjectListTab';
import ProjectSettingsTab from '@/pages/projects/ProjectSettingsTab';

interface ProjectsViewProps {
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  showInlineTabs?: boolean;
}

const TABS = [
  { id: 'actives', label: 'Proyectos Activos' },
  { id: 'list', label: 'Lista de Proyectos' },
  { id: 'settings', label: 'Ajustes' },
];

export function ProjectsView({ activeTab, onTabChange, showInlineTabs = false }: ProjectsViewProps) {
  const { openModal } = useGlobalModalStore();
  
  const { data: userData, isLoading } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: projectsCount = 0 } = useProjectsCount(organizationId || undefined);

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';
  const shouldShowInlineTabs = showInlineTabs || (!isLabLayout && onTabChange);

  if (isLoading || projectsLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando proyectos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {shouldShowInlineTabs && onTabChange && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {activeTab !== 'settings' && (
        <div className="flex justify-end">
          <PlanRestricted 
            feature="max_projects" 
            current={projectsCount}
            functionName="Crear Proyecto"
            useUpgradeModal={true}
            modalImage={FEATURE_IMAGES.PROJECTS}
            modalTitle="Alcanzaste el límite de proyectos"
            modalDescription="Has llegado al máximo de proyectos permitidos en tu plan actual. Actualiza a un plan superior para crear proyectos ilimitados y gestionar tu negocio sin restricciones."
          >
            <Button
              onClick={() => openModal('project', {})}
              className="h-8 px-3 text-xs"
              data-testid="button-new-project"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Proyecto
            </Button>
          </PlanRestricted>
        </div>
      )}

      {activeTab === 'actives' && <ProjectActivesTab />}
      {activeTab === 'list' && <ProjectListTab />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
  );
}
