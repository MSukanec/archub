import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Building2, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";

export function MainHeader() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();

  // Mock data - replace with real data later
  const currentOrganization = "Mi Organización";
  const currentProject = "Proyecto Actual";

  const handleOrganizationClick = () => {
    navigate('/profile/organizations');
  };

  const handleProjectClick = () => {
    navigate('/professional/projects');
  };

  return (
    <div className="w-full h-12 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-50">
      {/* Left side: Logo and navigation */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/ArchubLogo.png" 
            alt="Archub" 
            className="h-8 w-auto"
          />
        </div>

        {/* Organization selector */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOrganizationClick}
            className="h-8 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Organización
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {currentOrganization}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Organización
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-sm"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Mi Organización
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-sm"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Otra Organización
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Project selector */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProjectClick}
            className="h-8 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            Proyecto
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {currentProject}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Proyecto
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-sm"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Proyecto Actual
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-sm"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Otro Proyecto
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right side: User avatar */}
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}