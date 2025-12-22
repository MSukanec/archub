import { useState } from 'react';
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
  onTabChange?: (tabId: string) => void;
}

export function ProjectsView({ onTabChange }: ProjectsViewProps) {
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('actives');
  
  const { data: userData, isLoading } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined);
  const { data: projectsCount = 0 } = useProjectsCount(organizationId || undefined);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const tabs = [
    { id: 'actives', label: 'Proyectos Activos', isActive: activeTab === 'actives' },
    { id: 'list', label: 'Lista de Proyectos', isActive: activeTab === 'list' },
    { id: 'settings', label: 'Ajustes', isActive: activeTab === 'settings' },
  ];

  if (isLoading || projectsLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando proyectos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab.isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab !== 'settings' && (
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
        )}
      </div>

      {activeTab === 'actives' && <ProjectActivesTab />}
      {activeTab === 'list' && <ProjectListTab />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
  );
}
