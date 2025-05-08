import { useState, ReactNode, useEffect } from "react";
import { Sidebar, SidebarTypes, SidebarType } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  mobileSidebarOpen?: boolean;
  onMobileSidebarOpenChange?: (open: boolean) => void;
  sidebarType?: SidebarType;
  selectedProject?: string | number | null;
  selectedOrganization?: string | null;
}

export function MainLayout({ 
  children,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  sidebarType: initialSidebarType,
  selectedProject: initialSelectedProject,
  selectedOrganization: initialSelectedOrganization
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  // Estado para la navegación
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(
    initialSelectedOrganization !== undefined ? String(initialSelectedOrganization) : null
  );
  
  const [selectedProject, setSelectedProject] = useState<string | null>(
    initialSelectedProject !== undefined ? String(initialSelectedProject) : null
  );
  
  const [sidebarType, setSidebarType] = useState<SidebarType>(
    initialSidebarType || SidebarTypes.MainSidebar
  );
  
  // Handle mobile sidebar if we're controlling it from outside
  const [internalMobileSidebarOpen, setInternalMobileSidebarOpen] = useState(false);
  const sidebarOpen = mobileSidebarOpen !== undefined ? mobileSidebarOpen : internalMobileSidebarOpen;
  const setSidebarOpen = onMobileSidebarOpenChange || setInternalMobileSidebarOpen;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Gestionar cambios en la organización seleccionada
  const handleOrganizationChange = (organizationId: string | null) => {
    setSelectedOrganization(organizationId);
    setSelectedProject(null);
    setSidebarType(SidebarTypes.MainSidebar);
  };
  
  // Gestionar cambios en el proyecto seleccionado
  const handleProjectChange = (projectId: string | null) => {
    setSelectedProject(projectId);
    setSidebarType(SidebarTypes.ProjectSidebar);
  };
  
  // Gestionar cambios en el tipo de sidebar
  const handleSidebarTypeChange = (type: SidebarType) => {
    setSidebarType(type);
  };

  // Actualizar el estado interno cuando cambian las props
  useEffect(() => {
    if (initialSidebarType) {
      console.log("Updating sidebar type:", initialSidebarType);
      setSidebarType(initialSidebarType);
    }
  }, [initialSidebarType]);
  
  // Debug para ver cuándo cambian las props
  useEffect(() => {
    console.log("MainLayout props updated:", {
      type: initialSidebarType,
      projectId: initialSelectedProject
    });
  }, [initialSidebarType, initialSelectedProject]);

  useEffect(() => {
    if (initialSelectedProject !== undefined) {
      const projectId = initialSelectedProject !== null ? String(initialSelectedProject) : null;
      console.log("Updating selected project:", projectId);
      setSelectedProject(projectId);
      
      // Si se selecciona un proyecto, cambiar automáticamente a ProjectSidebar
      if (projectId) {
        setSidebarType(SidebarTypes.ProjectSidebar);
      }
    }
  }, [initialSelectedProject]);

  useEffect(() => {
    if (initialSelectedOrganization !== undefined) {
      const orgId = initialSelectedOrganization !== null ? String(initialSelectedOrganization) : null;
      console.log("Updating selected organization:", orgId);
      setSelectedOrganization(orgId);
    }
  }, [initialSelectedOrganization]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header en la parte superior */}
      <Header 
        toggleSidebar={toggleSidebar} 
        onOrganizationChange={handleOrganizationChange}
        onProjectChange={handleProjectChange}
        selectedOrganization={selectedOrganization}
        selectedProject={selectedProject}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Debajo del header */}
        {!isMobile && (
          <div className="h-full">
            <Sidebar 
              type={sidebarType}
              onTypeChange={handleSidebarTypeChange}
              selectedOrganization={selectedOrganization}
              selectedProject={selectedProject}
            />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[300px] p-0 pt-16">
              <Sidebar 
                type={sidebarType}
                onTypeChange={handleSidebarTypeChange}
                selectedOrganization={selectedOrganization}
                selectedProject={selectedProject}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto transition-all duration-200">
          <main className={`flex-1 h-full overflow-auto ${isMobile ? 'p-3 pb-20' : 'p-6'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}