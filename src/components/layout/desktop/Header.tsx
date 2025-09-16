import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";

export function Header() {
  const { data: currentUser } = useCurrentUser();
  
  // Mock project data for now - will be connected to real data later
  const currentProject = null; // No project selected initially
  
  return (
    <header 
      className="h-10 flex items-center pl-4 pr-6"
      style={{
        backgroundColor: "var(--main-sidebar-bg)",
      }}
    >
      {/* Logo - Aligned with sidebar icons */}
      <div className="flex items-center">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--primary-foreground)",
          }}
        >
          A
        </div>
      </div>

      {/* Organization Selector */}
      <div className="flex items-center ml-6">
        <Button
          variant="ghost"
          className="h-8 px-3 justify-start text-sm font-normal hover:bg-opacity-10 hover:bg-white border-0"
          style={{
            color: "white",
          }}
        >
          {currentUser?.organization?.name || "Seleccionar Organización"}
        </Button>
        
        {/* Organization dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1 hover:bg-opacity-10 hover:bg-white border-0"
              style={{
                color: "white",
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {currentUser?.organizations?.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => {
                  // TODO: Implement organization switching
                  console.log("Switch to organization:", org.name);
                }}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: org.id === currentUser?.organization?.id ? "var(--accent)" : "var(--muted)",
                    color: org.id === currentUser?.organization?.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </div>
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Selector */}
      <div className="flex items-center ml-4">
        <Button
          variant="ghost"
          className="h-8 px-3 justify-start text-sm font-normal hover:bg-opacity-10 hover:bg-white border-0"
          style={{
            color: "white",
          }}
        >
          {currentProject ? currentProject.name : "Seleccionar Proyecto"}
        </Button>
        
        {/* Project dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1 hover:bg-opacity-10 hover:bg-white border-0"
              style={{
                color: "white",
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="text-muted-foreground">
              Sin Proyecto Seleccionado
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="opacity-50">
              <div className="flex flex-col gap-1">
                <span className="text-xs">Proyectos disponibles:</span>
                <span className="text-xs opacity-70">Próximamente...</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - could add user profile, notifications, etc. */}
      <div className="flex-1" />
    </header>
  );
}