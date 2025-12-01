import { createContext, useContext, useMemo } from 'react';

interface ProjectReadOnlyContextValue {
  isReadOnly: boolean;
  projectName?: string;
  shouldHideActions: boolean;
}

const ProjectReadOnlyContext = createContext<ProjectReadOnlyContextValue>({
  isReadOnly: false,
  projectName: undefined,
  shouldHideActions: false,
});

interface ProjectReadOnlyProviderProps {
  isReadOnly: boolean;
  projectName?: string;
  children: React.ReactNode;
}

export function ProjectReadOnlyProvider({ 
  isReadOnly, 
  projectName, 
  children 
}: ProjectReadOnlyProviderProps) {
  const value = useMemo(() => ({
    isReadOnly,
    projectName,
    shouldHideActions: isReadOnly,
  }), [isReadOnly, projectName]);

  return (
    <ProjectReadOnlyContext.Provider value={value}>
      {children}
    </ProjectReadOnlyContext.Provider>
  );
}

export function useProjectReadOnlyContext() {
  return useContext(ProjectReadOnlyContext);
}
