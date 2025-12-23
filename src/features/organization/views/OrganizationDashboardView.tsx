import { useEffect, useState, useCallback } from 'react';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects, updateProjectLastActive } from '@/features/projects';
import { useContacts } from '@/features/contacts';
import { useSiteLogs } from '@/features/sitelog/hooks/use-site-logs';
import { useUserOrganizationPreferences, USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization';
import { useProjectContext } from '@/stores/projectContext';
import { supabase } from '@/lib/supabase';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { uploadOrgLogo } from '@/lib/storage';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import type { UserData } from "@/hooks/use-current-user";

import { WelcomePanel } from '../panels/WelcomePanel';
import { StatsPanel } from '../panels/StatsPanel';
import { ProjectsPanel } from '../panels/ProjectsPanel';

interface OrganizationDashboardViewProps {
  onProjectSelected?: (projectId: string) => void;
  onNavigateToProjects?: () => void;
}

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

  const preferencesQueryKey = USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userId!, organizationId!);

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
    optimisticUpdate: (oldData) => oldData,
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
