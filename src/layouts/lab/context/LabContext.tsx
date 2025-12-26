import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getProjectsLite } from '@/features/projects/services/getProjectsLite';

interface Organization {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface LabContextValue {
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  organizations: Organization[];
  projects: Project[];
  selectedProject: Project | undefined;
  isLoading: boolean;
}

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const organizations = userData?.organizations || [];
  
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['lab-projects', selectedOrgId],
    queryFn: () => getProjectsLite(selectedOrgId!),
    enabled: !!selectedOrgId,
    staleTime: 0,
  });
  
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);
  
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  useEffect(() => {
    setSelectedProjectId(null);
  }, [selectedOrgId]);
  
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  
  const value: LabContextValue = {
    selectedOrgId,
    setSelectedOrgId,
    selectedProjectId,
    setSelectedProjectId,
    organizations,
    projects,
    selectedProject,
    isLoading: userLoading || projectsLoading,
  };
  
  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}
