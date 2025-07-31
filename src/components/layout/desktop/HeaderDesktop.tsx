import React, { useState } from "react";
import { ChevronDown, Plus, Filter, X, Search, Building, Building2, Folder, Menu, DollarSign, Users, Calendar, BarChart3, FileText, Settings, User } from "lucide-react";
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
}: HeaderDesktopProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useGlobalModalStore();

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext, setActiveSidebarSection } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  // Estado local para tracking inmediato del proyecto seleccionado
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(selectedProjectId);
  
  // Sincronizar localSelectedProject con userData cuando cambie desde otras páginas
  useEffect(() => {
    if (userData?.preferences?.last_project_id !== undefined) {
      setLocalSelectedProject(userData.preferences.last_project_id);
    }
  }, [userData?.preferences?.last_project_id]);

  // Mutation para actualizar proyecto seleccionado
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) return;
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setSelectedProject(projectId || null);
    }
  });

  const handleProjectChange = (projectId: string) => {
    setLocalSelectedProject(projectId);
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

  const getPageBreadcrumb = () => {
    const section = getCurrentSectionLabel();
    const pageName = pageMap[location];
    
    if (pageName && section !== pageName) {
      return `${section} > ${pageName}`;
    }
    
    return title || section;
  };

  const getBreadcrumbIcon = () => {
    // Mapeo específico de páginas a iconos
    const iconMap: { [key: string]: React.ReactNode } = {
      // Finanzas
      "/finances/movements": <DollarSign className="w-4 h-4 text-[var(--accent)]" />,
      "/finances/installments": <FileText className="w-4 h-4 text-[var(--accent)]" />, 
      "/finances/analysis": <BarChart3 className="w-4 h-4 text-[var(--accent)]" />,
      "/finances": <DollarSign className="w-4 h-4 text-[var(--accent)]" />,
      
      // Construcción  
      "/construction/tasks": <BarChart3 className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/budgets": <DollarSign className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/materials": <Building2 className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/schedule": <Calendar className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/logs": <FileText className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/attendance": <Users className="w-4 h-4 text-[var(--accent)]" />,
      "/construction/gallery": <FileText className="w-4 h-4 text-[var(--accent)]" />,
      "/construction": <Building2 className="w-4 h-4 text-[var(--accent)]" />,
      
      // Diseño
      "/design/dashboard": <Building2 className="w-4 h-4 text-[var(--accent)]" />,
      "/design/documentation": <FileText className="w-4 h-4 text-[var(--accent)]" />,
      
      // Organización
      "/organization/projects": <Folder className="w-4 h-4 text-[var(--accent)]" />,
      "/organization/contacts": <Users className="w-4 h-4 text-[var(--accent)]" />,
      "/organization/preferences": <Settings className="w-4 h-4 text-[var(--accent)]" />,
      "/organization/activity": <BarChart3 className="w-4 h-4 text-[var(--accent)]" />,
      "/organization/tasks": <FileText className="w-4 h-4 text-[var(--accent)]" />
    };

    return iconMap[location] || <Folder className="w-4 h-4 text-[var(--accent)]" />;
  };

  const isProjectBasedSection = location.startsWith("/design") || location.startsWith("/construction") || location.startsWith("/finances");

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
        {/* Left: Page Title with Icon */}
        <div className="flex items-center gap-2">
          {getBreadcrumbIcon()}
          <h1 className="text-sm font-medium text-[var(--layout-text)]">
            {pageMap[location] || title || getCurrentSectionLabel()}
          </h1>
        </div>

        {/* Right: Project Selector (only if project-based section) */}
        <div className="flex items-center">
          {isProjectBasedSection && (
            <CustomRestricted feature="project_management">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <Folder className="w-4 h-4 mr-1" />
                    {projects.find(p => p.id === localSelectedProject)?.name || "Seleccionar proyecto"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => handleProjectChange('')}
                    className={`${!localSelectedProject ? 'bg-[var(--accent)] text-white' : ''}`}
                  >
                    <div className="flex items-center w-full">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span className="truncate">General</span>
                    </div>
                    {!localSelectedProject && (
                      <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
                    )}
                  </DropdownMenuItem>
                  
                  {projects.length > 0 && <DropdownMenuSeparator />}
                  
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                      className={`${localSelectedProject === project.id ? 'bg-[var(--accent)] text-white' : ''}`}
                    >
                      <div className="flex items-center w-full">
                        <Folder className="w-4 h-4 mr-2" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      {localSelectedProject === project.id && (
                        <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CustomRestricted>
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