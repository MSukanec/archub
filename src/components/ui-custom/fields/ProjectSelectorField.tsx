import React from "react";
import { Folder } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Project {
  id: string;
  name: string;
  color?: string | null;
}

interface ProjectSelectorFieldProps {
  projects: Project[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Function to get project initials
const getProjectInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export default function ProjectSelectorField({
  projects,
  value,
  onChange,
  placeholder = "Seleccionar proyecto",
  className = ""
}: ProjectSelectorFieldProps) {
  // Sort projects alphabetically by name
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [projects]);

  const selectedProject = sortedProjects.find(project => project.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {selectedProject ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback 
                  className="text-xs font-medium text-white"
                  style={{ 
                    backgroundColor: selectedProject.color || '#64748b' 
                  }}
                >
                  {getProjectInitials(selectedProject.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedProject.name}</span>
            </>
          ) : (
            <>
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{placeholder}</span>
            </>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {sortedProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback 
                  className="text-xs font-medium text-white"
                  style={{ 
                    backgroundColor: project.color || '#64748b' 
                  }}
                >
                  {getProjectInitials(project.name)}
                </AvatarFallback>
              </Avatar>
              <span>{project.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}