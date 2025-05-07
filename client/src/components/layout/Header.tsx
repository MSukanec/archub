import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ProfileMenu } from "@/components/common/ProfileMenu";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideMenu, LucidePlus, LucideSearch, LucideZap, LucideChevronRight } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  toggleSidebar?: () => void;
  onOrganizationChange?: (organizationId: string | null) => void;
  onProjectChange?: (projectId: string | null) => void;
  selectedOrganization?: string | null;
  selectedProject?: string | null;
}

export function Header({ 
  toggleSidebar, 
  onOrganizationChange, 
  onProjectChange,
  selectedOrganization = null, 
  selectedProject = null 
}: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Fetch real project data instead of using mock data
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: !!selectedOrganization,
  });
  
  // Temp mock data for organizations - Should be replaced with actual API data
  const organizations = [
    { id: "1", name: "Mi Organización" },
    { id: "2", name: "Otra Organización" }
  ];
  
  // Use the first organization by default if none is selected
  useEffect(() => {
    if (!selectedOrganization && organizations.length > 0 && onOrganizationChange) {
      onOrganizationChange(organizations[0].id);
    }
  }, [selectedOrganization, organizations, onOrganizationChange]);

  // Query for user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  // Función para manejar la selección de un proyecto en la búsqueda
  const handleSelectProject = (projectId: string) => {
    if (onProjectChange) {
      onProjectChange(projectId);
      setLocation(`/projects/${projectId}`);
    }
    setSearchOpen(false);
  };

  return (
    <header className="z-30 bg-white border-b sticky top-0 w-full h-16">
      <div className="flex items-center justify-between px-5 h-full">
        {/* Left section with app logo */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <LucideMenu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex flex-col items-start mr-6">
            <div className="flex items-center">
              <LucideZap className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium text-gray-800">
                {APP_NAME}
              </span>
            </div>
            <span className="text-xs text-gray-500 ml-8 -mt-1">
              {APP_SUBTITLE}
            </span>
          </div>
          
          {/* Organization and Project Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  className="px-2 h-9 flex items-center gap-1 font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    if (onOrganizationChange && selectedOrganization) {
                      setLocation('/organization');
                    }
                  }}
                >
                  {selectedOrganization ? 
                    organizations.find(org => org.id === selectedOrganization)?.name : 
                    "Organización"}
                </Button>
              </NavigationMenuItem>
              
              {selectedOrganization && (
                <>
                  <NavigationMenuItem>
                    <LucideChevronRight className="h-4 w-4 text-gray-400" />
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost" 
                      className="px-2 h-9 flex items-center gap-1 font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        if (onProjectChange && selectedProject) {
                          setLocation(`/projects/${selectedProject}`);
                        }
                      }}
                    >
                      {selectedProject ? 
                        projects.find(proj => String(proj.id) === String(selectedProject))?.name || `Proyecto #${selectedProject}` : 
                        "Seleccionar Proyecto"}
                    </Button>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="rounded-md border border-gray-200 px-3 py-1 flex items-center max-w-md w-64 h-9 hidden md:flex ml-auto cursor-pointer" onClick={() => setSearchOpen(true)}>
            <LucideSearch className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Buscar proyectos...</span>
          </div>
          
          <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
            <CommandInput placeholder="Buscar proyectos..." />
            <CommandList>
              <CommandEmpty>No se encontraron proyectos.</CommandEmpty>
              <CommandGroup heading="Proyectos">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => handleSelectProject(String(project.id))}
                    className="flex items-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                    <span>{project.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {project.status ? `(${project.status})` : ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </div>

        {/* Right section with actions and user profile */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setLocation('/notifications')}
          >
            <LucideBell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <ProfileMenu user={user || null} />
        </div>
      </div>
    </header>
  );
}
