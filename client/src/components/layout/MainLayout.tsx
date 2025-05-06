import { useState, ReactNode } from "react";
import { Sidebar, SidebarType } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  mobileSidebarOpen?: boolean;
  onMobileSidebarOpenChange?: (open: boolean) => void;
}

export function MainLayout({ 
  children,
  mobileSidebarOpen,
  onMobileSidebarOpenChange
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  // Estado para la navegación
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sidebarType, setSidebarType] = useState<SidebarType>(SidebarType.MainSidebar);
  
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
    setSidebarType(SidebarType.MainSidebar);
  };
  
  // Gestionar cambios en el proyecto seleccionado
  const handleProjectChange = (projectId: string | null) => {
    setSelectedProject(projectId);
    setSidebarType(SidebarType.ProjectSidebar);
  };
  
  // Gestionar cambios en el tipo de sidebar
  const handleSidebarTypeChange = (type: SidebarType) => {
    setSidebarType(type);
  };

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
        <div className="fixed left-0 top-16 bottom-0 z-20">
          <Sidebar 
            type={sidebarType}
            onTypeChange={handleSidebarTypeChange}
            selectedOrganization={selectedOrganization}
            selectedProject={selectedProject}
          />
        </div>

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
        <div className="flex-1 ml-16 sm:ml-[220px] transition-all duration-200">
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}