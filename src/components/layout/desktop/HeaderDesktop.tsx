import React, { useState } from "react";
import { ChevronDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
import { useProjectContext } from "@/stores/projectContext";
import { useEffect } from "react";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";


interface Tab {
  id: string;
  label: string;
  isActive: boolean;
}

interface HeaderDesktopProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[];
  customFilters?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode[];
  // Props para sistema de tabs
  tabs?: Tab[];
  onTabChange?: (tabId: string) => void;
  // 🆕 NUEVA PROP: Botón de acción principal
  actionButton?: {
    label: string;
    icon?: React.ComponentType<any>;
    onClick: () => void;
  };
}

export function HeaderDesktop({
  icon,
  title,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [],
  customFilters,
  onClearFilters,
  actions = [],
  tabs = [],
  onTabChange,
  actionButton,
}: HeaderDesktopProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useGlobalModalStore();

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext, setActiveSidebarSection } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  // Usar directamente userData.preferences.last_project_id como fuente de verdad

  // Mutation para actualizar proyecto seleccionado usando nuevo sistema
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id) return;
      
      console.log("🔧 HeaderDesktop: Updating project", { projectId, organizationId: userData.organization.id });
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: userData.user.id,
            organization_id: userData.organization.id,
            last_project_id: projectId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,organization_id' }
        );
      
      if (error) {
        console.error("🔧 HeaderDesktop: Error updating project", error);
        // Fallback to localStorage
        localStorage.setItem(`last-project-${userData.organization.id}`, projectId);
      }
      
      return projectId;
    },
    onSuccess: (projectId) => {
      console.log("🔧 HeaderDesktop: Project updated successfully", projectId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setSelectedProject(projectId || null);
    }
  });

  const handleProjectChange = (projectId: string) => {
    updateProjectMutation.mutate(projectId);
  };

  const getCurrentSectionLabel = () => {
    if (location === "/") return "Gestión de Organizaciones";
    if (location.startsWith("/design")) return "Diseño";
    if (location.startsWith("/construction")) return "Construcción";
    if (location.startsWith("/finances")) return "Finanzas";
    if (location.startsWith("/teams")) return "Equipos";
    if (location.startsWith("/profile")) return "Perfil";
    if (location.startsWith("/settings")) return "Configuración";
    if (location.startsWith("/admin")) return "Administración";
    if (location.startsWith("/organization")) return "Organización";
    return "Archub";
  };

  const getBreadcrumbText = () => {
    const section = getCurrentSectionLabel();
    const pageName = pageMap[location];
    const projectName = projects.find(p => p.id === userData?.preferences?.last_project_id)?.name;
    
    if (isProjectBasedSection && projectName) {
      if (pageName && section !== pageName) {
        return `${projectName} / ${section} / ${pageName}`;
      }
      return `${projectName} / ${section}`;
    }
    
    return title || section;
  };

  // Mapeo de páginas específicas - definido fuera de funciones para reutilizar
  const pageMap: { [key: string]: string } = {
    // Finanzas
    "/finances/movements": "Movimientos",
    "/finances/installments": "Aportes de Terceros", 
    "/finances/analysis": "Análisis de Obra",
    "/finances": "Resumen Financiero",
    
    // Construcción  
    "/construction/tasks": "Tareas",
    "/construction/budgets": "Presupuestos",
    "/construction/materials": "Materiales",
    "/construction/schedule": "Cronograma",
    "/construction/logs": "Bitácoras",
    "/construction/attendance": "Asistencia",
    "/construction/gallery": "Galería",
    "/construction/subcontracts": "Subcontratos",
    "/construction": "Resumen de Construcción",
    
    // Diseño
    "/design/dashboard": "Resumen de Diseño",
    "/design/documentation": "Documentación",
    
    // Organización
    "/organization/projects": "Proyectos",
    "/organization/contacts": "Contactos",
    "/organization/preferences": "Preferencias",
    "/organization/activity": "Actividad",
    "/organization/tasks": "Tareas para Hacer"
  };



  const isProjectBasedSection = location.startsWith("/design") || location.startsWith("/construction") || location.startsWith("/finances") || location.startsWith("/organization");

  // Hook para detectar el estado del sidebar
  const { isDocked: isMainDocked, isHovered: isMainHovered } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered } = useSecondarySidebarStore();
  
  const isSecondaryExpanded = isSecondaryDocked || isSecondaryHovered || isMainHovered;
  const hasTabs = tabs.length > 0;

  return (
    <div 
      className={`fixed top-0 right-0 z-50 ${hasTabs ? 'h-20' : 'h-10'} border-b border-[var(--menues-border)] bg-[var(--layout-bg)] transition-all duration-300 ${
        // Calculate left margin based on fixed main sidebar (40px) and variable secondary sidebar
        isSecondaryExpanded
          ? "left-[304px]" // 40px main + 264px secondary  
          : "left-[80px]" // 40px main + 40px secondary
      }`}
    >
      {/* Primera fila: Breadcrumb y Selector de Proyecto */}
      <div className="w-full h-10 px-4 flex items-center justify-between">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2">
          {isProjectBasedSection ? (
            /* Project-based breadcrumb with dropdown */
            <div className="flex items-center gap-1">
              <CustomRestricted feature="project_management">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleProjectChange(project.id)}
                        className={`${userData?.preferences?.last_project_id === project.id ? 'bg-[var(--accent)] text-white' : ''}`}
                      >
                        <div className="flex items-center w-full">
                          <Folder className="w-4 h-4 mr-2" />
                          <span className="truncate">{project.name}</span>
                        </div>
                        {userData?.preferences?.last_project_id === project.id && (
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CustomRestricted>
              <span className="text-xs font-normal text-[var(--layout-text)]">
                {projects.find(p => p.id === userData?.preferences?.last_project_id)?.name || "Sin proyecto"}
              </span>
              <span className="text-xs text-[var(--layout-text-muted)]">/</span>
              <span className="text-xs font-normal text-[var(--layout-text)]">
                {getCurrentSectionLabel()}
              </span>
              {pageMap[location] && getCurrentSectionLabel() !== pageMap[location] && (
                <>
                  <span className="text-xs text-[var(--layout-text-muted)]">/</span>
                  <span className="text-xs font-normal text-[var(--layout-text)]">
                    {pageMap[location]}
                  </span>
                </>
              )}
            </div>
          ) : (
            /* Non-project breadcrumb */
            <h1 className="text-xs font-normal text-[var(--layout-text)]">
              {title || getCurrentSectionLabel()}
            </h1>
          )}
        </div>

        {/* Right: Action Button */}
        <div className="flex items-center gap-2">
          {/* Action Button */}
          {actionButton && (
            <Button
              variant="default"
              size="sm"
              onClick={actionButton.onClick}
              className="h-8 px-3 text-xs font-normal"
            >
              {actionButton.icon && <actionButton.icon className="w-4 h-4 mr-1" />}
              {actionButton.label}
            </Button>
          )}
        </div>
      </div>

      {/* Segunda fila: Tabs (solo si hay tabs) */}
      {hasTabs && (
        <div className="w-full h-10 px-4 flex items-center">
          <div className="flex items-center space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`relative text-sm transition-colors duration-200 ${
                  tab.isActive 
                    ? 'text-[var(--layout-text)] font-medium' 
                    : 'text-[var(--layout-text-muted)] hover:text-[var(--layout-text)]'
                }`}
              >
                {tab.label}
                {tab.isActive && (
                  <div 
                    className="absolute -bottom-[9px] left-0 right-0 h-0.5"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}