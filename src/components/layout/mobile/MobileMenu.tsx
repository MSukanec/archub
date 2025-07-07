import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building,
  FolderOpen,
  CheckSquare,
  Shield,
  Home,
  Mail,
  Activity,
  Users,
  Settings,
  DollarSign,
  Calculator,
  Package,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Contact,
  Database,
  Layout,
  Images,
  Handshake,
  CreditCard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileMenuStore } from "./useMobileMenuStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useProjects } from "@/hooks/useProjects";
import { useAuthStore } from "@/stores/authStore";
import { navigate } from "wouter/use-browser-location";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const { userData, signOut } = useAuthStore();
  const { data: organizations } = useOrganizations();
  const { data: projects } = useProjects();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('left');

  // Get current organization and project from user preferences
  const currentOrganization = organizations?.find(org => org.id === userData?.preferences?.last_organization_id);
  const currentProject = projects?.find(project => project.id === userData?.preferences?.last_project_id);

  const handleContextChange = (newContext: string) => {
    const currentHierarchy = ['organization', 'project', 'design', 'construction', 'finances', 'commercialization'];
    const currentIndex = currentHierarchy.indexOf(currentSidebarContext);
    const newIndex = currentHierarchy.indexOf(newContext);
    
    setAnimationDirection(newIndex > currentIndex ? 'left' : 'right');
    setIsAnimating(true);
    
    setTimeout(() => {
      setSidebarContext(newContext);
      setIsAnimating(false);
    }, 300);
  };

  const handleOrganizationChange = async (organizationId: string) => {
    // Update user preferences with new organization
    // This will trigger a refresh of projects for the new organization
    onClose();
  };

  const handleProjectChange = async (projectId: string) => {
    // Update user preferences with new project
    onClose();
  };

  // Define sidebar contexts
  const sidebarContexts = {
    organization: [
      { icon: Building, label: "Resumen de la Organización", href: "/dashboard" },
      { type: "divider" },
      { icon: FolderOpen, label: "Proyectos", href: "/organization/projects" },
      { icon: Contact, label: "Contactos", href: "/organization/contacts" },
      { icon: Activity, label: "Actividad", href: "/organization/activity" },
      { icon: Users, label: "Miembros", href: "/organization/members" },
      { icon: CheckSquare, label: "Tareas", href: "/organization/tasks" },
      { type: "divider" },
      { icon: Building, label: "PROYECTO", context: "project", rightIcon: ChevronRight },
      { icon: Database, label: "DISEÑO", context: "design", rightIcon: ChevronRight },
      { icon: Package, label: "OBRA", context: "construction", rightIcon: ChevronRight },
      { icon: DollarSign, label: "FINANZAS", context: "finances", rightIcon: ChevronRight },
      { icon: Handshake, label: "COMERCIALIZACIÓN", context: "commercialization", rightIcon: ChevronRight },
    ],
    project: [
      { icon: FolderOpen, label: "Resumen del Proyecto", href: "/project/dashboard" },
      { type: "divider" },
      { icon: Database, label: "Datos Básicos", href: "/project/basic-data" },
      { icon: Layout, label: "Diseño", context: "design", rightIcon: ChevronRight },
      { icon: Package, label: "Obra", context: "construction", rightIcon: ChevronRight },
      { icon: DollarSign, label: "Finanzas", context: "finances", rightIcon: ChevronRight },
      { icon: Handshake, label: "Comercialización", context: "commercialization", rightIcon: ChevronRight },
      { type: "divider" },
      { icon: ArrowLeft, label: "Volver a Organización", context: "organization" },
    ],
    design: [
      { icon: Layout, label: "Resumen de Diseño", href: "/design/dashboard" },
      { type: "divider" },
      { icon: FileText, label: "Documentación", href: "/design/documentation" },
      { icon: Calendar, label: "Cronograma", href: "/design/timeline" },
      { icon: Layout, label: "Tablero", href: "/design/board" },
      { icon: Calculator, label: "Cómputo", href: "/design/compute" },
      { icon: Settings, label: "Preferencias de Diseño", href: "/design/preferences" },
      { type: "divider" },
      { icon: ArrowLeft, label: "Volver a Proyecto", context: "project" },
    ],
    construction: [
      { icon: Package, label: "Resumen de Obra", href: "/construction/dashboard" },
      { type: "divider" },
      { icon: Calculator, label: "Presupuestos", href: "/construction/budgets" },
      { icon: Package, label: "Materiales", href: "/construction/materials" },
      { icon: FileText, label: "Bitácora", href: "/construction/logs" },
      { icon: Users, label: "Personal", href: "/construction/personnel" },
      { icon: Images, label: "Galería", href: "/construction/gallery" },
      { type: "divider" },
      { icon: ArrowLeft, label: "Volver a Proyecto", context: "project" },
    ],
    finances: [
      { icon: DollarSign, label: "Resumen de Finanzas", href: "/finances/dashboard" },
      { type: "divider" },
      { icon: DollarSign, label: "Movimientos", href: "/finances/movements" },
      { icon: CreditCard, label: "Aportes", href: "/finances/installments" },
      { icon: Settings, label: "Preferencias de Finanzas", href: "/finances/preferences" },
      { type: "divider" },
      { icon: ArrowLeft, label: "Volver a Proyecto", context: "project" },
    ],
    commercialization: [
      { icon: Handshake, label: "Resumen de Comercialización", href: "/commercialization/dashboard" },
      { type: "divider" },
      { icon: ArrowLeft, label: "Volver a Proyecto", context: "project" },
    ],
    admin: [
      { icon: Shield, label: "Resumen de Administración", href: "/admin/dashboard" },
      { type: "divider" },
      { icon: Building, label: "Organizaciones", href: "/admin/organizations" },
      { icon: Users, label: "Usuarios", href: "/admin/users" },
      { icon: Mail, label: "Changelog", href: "/admin/changelogs" },
      { type: "divider" },
      { icon: CheckSquare, label: "Tareas", href: "/admin/tasks" },
      { icon: CheckSquare, label: "Tareas Generadas", href: "/admin/generated-tasks" },
      { icon: FileText, label: "Plantillas de Tareas", href: "/admin/task-templates" },
      { icon: Settings, label: "Parámetros", href: "/admin/task-parameters" },
      { type: "divider" },
      { icon: Package, label: "Materiales", href: "/admin/materials" },
      { icon: Package, label: "Categorías de Materiales", href: "/admin/material-categories" },
    ],
  };

  const navigationItems = sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] || sidebarContexts.organization;

  const menuContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70" 
        onClick={onClose}
      />
      
      {/* Menu Container */}
      <div 
        className="absolute top-16 left-0 right-0 bottom-0 flex flex-col"
        style={{ backgroundColor: 'var(--sidebar-background)' }}
      >
        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <nav className={cn(
            "space-y-1 transition-all duration-300 ease-in-out",
            isAnimating && animationDirection === 'left' && "transform translate-x-full opacity-0",
            isAnimating && animationDirection === 'right' && "transform -translate-x-full opacity-0",
            !isAnimating && "transform translate-x-0 opacity-100"
          )}>
            {navigationItems.map((item: any, index: number) => (
              <div key={`${item.label || 'divider'}-${index}`}>
                {/* Divider */}
                {item.type === 'divider' ? (
                  <div className="mx-3 my-3 border-t border-[var(--menues-border)]" />
                ) : (
                  /* Menu Item */
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200",
                      "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
                      "border-0 rounded-none"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.context) {
                        handleContextChange(item.context);
                      } else if (item.href) {
                        navigate(item.href);
                        onClose();
                      } else if (item.action) {
                        item.action();
                        onClose();
                      }
                    }}
                  >
                    {/* Icon */}
                    {item.icon && (
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    )}
                    
                    {/* Label */}
                    <span className="flex-1 font-medium">
                      {item.label}
                    </span>
                    
                    {/* Right Icon */}
                    {item.context && (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                    {item.rightIcon && (
                      <item.rightIcon className="h-4 w-4 opacity-60" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer - Selectores */}
        <div className="border-t border-[var(--menues-border)] p-4 space-y-3">
          {/* Organization Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--sidebar-muted-foreground)] uppercase tracking-wide">
              Organización
            </label>
            <Select
              value={currentOrganization?.id || ''}
              onValueChange={(value) => {
                if (value && value !== currentOrganization?.id) {
                  handleOrganizationChange(value);
                }
              }}
            >
              <SelectTrigger 
                className="w-full h-10 bg-[var(--sidebar-background)] border-[var(--sidebar-border)] text-[var(--sidebar-foreground)]"
              >
                <SelectValue placeholder="Seleccionar organización" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--sidebar-muted-foreground)] uppercase tracking-wide">
              Proyecto
            </label>
            <Select
              value={currentProject?.id || ''}
              onValueChange={(value) => {
                if (value && value !== currentProject?.id) {
                  handleProjectChange(value);
                }
              }}
            >
              <SelectTrigger 
                className="w-full h-10 bg-[var(--sidebar-background)] border-[var(--sidebar-border)] text-[var(--sidebar-foreground)]"
              >
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}