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
      className="h-10 flex items-center px-6 border-b"
      style={{
        backgroundColor: "var(--main-sidebar-bg)",
        borderColor: "var(--main-sidebar-border)",
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-3 justify-start text-sm font-normal"
              style={{
                color: "var(--main-sidebar-fg)",
              }}
            >
              {currentUser?.organization?.name || "Seleccionar Organización"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {currentUser?.organizations?.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => {
                  // TODO: Implement organization switching
                  console.log("Switch to organization:", org.name);
                }}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Organization dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1"
              style={{
                color: "var(--main-sidebar-fg-muted)",
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {currentUser?.organizations?.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => {
                  // TODO: Implement organization switching
                  console.log("Switch to organization:", org.name);
                }}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Selector */}
      <div className="flex items-center ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-3 justify-start text-sm font-normal"
              style={{
                color: currentProject 
                  ? "var(--main-sidebar-fg)" 
                  : "var(--main-sidebar-fg-muted)",
              }}
            >
              {currentProject?.name || "Seleccionar Proyecto"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>
              Proyecto Demo 1
            </DropdownMenuItem>
            <DropdownMenuItem>
              Proyecto Demo 2
            </DropdownMenuItem>
            <DropdownMenuItem>
              Sin Proyecto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Project dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1"
              style={{
                color: "var(--main-sidebar-fg-muted)",
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>
              Proyecto Demo 1
            </DropdownMenuItem>
            <DropdownMenuItem>
              Proyecto Demo 2
            </DropdownMenuItem>
            <DropdownMenuItem>
              Sin Proyecto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - could add user profile, notifications, etc. */}
      <div className="flex-1" />
    </header>
  );
}