import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ProfileMenu } from "@/components/common/ProfileMenu";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideMenu, LucidePlus, LucideSearch, LucideZap, LucideChevronRight, LucideMoon, LucideSun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
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
  
  // Tema
  const { theme, setTheme } = useTheme();

  return (
    <header className="z-30 bg-background border-b sticky top-0 w-full h-[45px]">
      <div className="flex items-center justify-between px-0 h-full">
        {/* Left section with app logo */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500 hover:text-gray-700 h-[45px] p-0"
            onClick={toggleSidebar}
          >
            <LucideMenu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Logo centered in the sidebar-header intersection */}
          <div className="flex items-center justify-center h-[45px] w-[45px] border-r">
            <LucideZap className="h-5 w-5 text-primary" />
          </div>
          
          <div className="hidden md:flex items-center ml-4">
            <span className="font-medium text-foreground">
              {APP_NAME}
            </span>
          </div>
          
          {/* Organization and Project Navigation */}
          <NavigationMenu className="hidden md:flex ml-2">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  className="px-2 h-8 flex items-center gap-1 font-medium text-foreground hover:bg-muted"
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
                      className="px-2 h-8 flex items-center gap-1 font-medium text-foreground hover:bg-muted"
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

          <div className="rounded-md border border-border px-3 py-1 flex items-center max-w-md w-64 h-7 hidden md:flex mx-4 cursor-pointer" onClick={() => setSearchOpen(true)}>
            <LucideSearch className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Buscar proyectos...</span>
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
        <div className="flex items-center space-x-3 mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground h-[35px] w-[35px] p-0"
            onClick={() => setLocation('/notifications')}
          >
            <LucideBell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {/* Theme toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground h-[35px] w-[35px] p-0"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <LucideSun className="h-5 w-5" />
            ) : (
              <LucideMoon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <ProfileMenu user={user || null} />
        </div>
      </div>
    </header>
  );
}
