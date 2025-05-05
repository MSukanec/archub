import { useState } from "react";
import { useLocation } from "wouter";
import { ProfileMenu } from "@/components/common/ProfileMenu";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideMenu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  toggleSidebar?: () => void;
  currentProjectId?: number;
  onProjectChange?: (projectId: number) => void;
}

export function Header({ toggleSidebar, currentProjectId, onProjectChange }: HeaderProps) {
  const [, setLocation] = useLocation();

  // Query for user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Query for projects 
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const currentProject = projects.find(project => project.id === currentProjectId);

  const handleProjectChange = (value: string) => {
    const projectId = parseInt(value);
    if (onProjectChange) {
      onProjectChange(projectId);
    }
  };

  return (
    <header className="bg-white border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section with project name */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <LucideMenu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex items-center min-w-[240px]">
            {projects.length > 0 ? (
              <Select
                value={currentProjectId?.toString()}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="bg-transparent border-none shadow-none h-auto p-0">
                  <SelectValue placeholder="Seleccionar Proyecto" className="font-medium text-gray-800" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="font-medium text-gray-800">
                {currentProject?.name || "Sin proyectos"}
              </span>
            )}
          </div>
        </div>

        {/* Right section with user profile */}
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
