import React, { useState } from "react";
import {
  X,
  Building,
  DollarSign,
  Hammer,
  Users,
  Calendar,
  FileText,
  Settings,
  CheckSquare,
  User,
  UserCircle,
  Home,
  FolderOpen,
  Mail,
  Activity,
  Tag,
  Calculator,
  FileCode,
  Package,
  Shield,
  Star,
  Zap,
  Crown,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [, navigate] = useLocation();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null,
  );
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get projects data
  const { data: projects = [] } = useProjects(
    userData?.preferences?.last_organization_id,
  );

  // Get current organization and project
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === userData?.preferences?.last_organization_id,
  );
  const currentProject = projects.find(
    (project) => project.id === userData?.preferences?.last_project_id,
  );

  // Organization selection mutation
  const organizationSelectMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { error } = await supabase
        .from("user_preferences")
        .update({ last_organization_id: organizationId })
        .eq("user_id", userData?.user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });

  // Project selection mutation
  const projectSelectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { error } = await supabase
        .from("user_preferences")
        .update({ last_project_id: projectId })
        .eq("user_id", userData?.user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleOrganizationSelect = (organizationId: string) => {
    organizationSelectMutation.mutate(organizationId);
    setSidebarContext("organization");
    onClose();
    navigate("/organization/dashboard");
  };

  const handleProjectSelect = (projectId: string) => {
    projectSelectMutation.mutate(projectId);
    setSidebarContext("project");
    onClose();
    navigate("/project/dashboard");
  };

  if (!isOpen) return null;

  const handleNavigation = (href: string, context?: string) => {
    if (context) {
      setSidebarContext(context as any);
    }
    onClose();
    navigate(href);
  };

  const toggleAccordion = (accordionId: string) => {
    setExpandedAccordion((prev) => (prev === accordionId ? null : accordionId));
  };

  // Define menu hierarchy for animations
  const getMenuDirection = (fromContext: string, toContext: string) => {
    const hierarchy = [
      "organization",
      "project",
      "design",
      "construction",
      "commercialization",
    ];
    const fromIndex = hierarchy.indexOf(fromContext);
    const toIndex = hierarchy.indexOf(toContext);

    if (fromIndex < toIndex) return "left"; // Going deeper (forward)
    if (fromIndex > toIndex) return "right"; // Going back
    return null; // Same level or admin
  };

  // Enhanced navigation with animations
  const handleContextChange = (newContext: string, url: string) => {
    const direction = getMenuDirection(currentSidebarContext, newContext);

    if (direction) {
      setAnimationDirection(direction);
      setIsAnimating(true);

      // Wait for animation to start, then change context
      setTimeout(() => {
        setSidebarContext(newContext as any);
        navigate(url);

        // Reset animation after context change
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationDirection(null);
        }, 150);
      }, 150);
    } else {
      setSidebarContext(newContext as any);
      navigate(url);
    }
  };

  // Define the same sidebar contexts as in Sidebar.tsx
  const sidebarContexts = {
    organization: [
      {
        icon: Home,
        label: "Resumen de la Organización",
        href: "/organization/dashboard",
      },
      {
        icon: ArrowRight,
        label: "Ir al proyecto",
        href: "#",
        onClick: () => handleContextChange("project", "/project/dashboard"),
      },
      { icon: FolderOpen, label: "Proyectos", href: "/proyectos" },
      { icon: Mail, label: "Contactos", href: "/organization/contactos" },
      { icon: Activity, label: "Actividad", href: "/organization/activity" },
      { icon: Users, label: "Miembros", href: "/organization/members" },
      {
        icon: Building,
        label: "Gestión de Organizaciones",
        href: "#",
        onClick: () => handleContextChange("organizations", "/organizations"),
      },
    ],
    project: [
      { icon: Home, label: "Resumen del Proyecto", href: "/project/dashboard" },
      {
        icon: FolderOpen,
        label: "Diseño",
        isAccordion: true,
        expanded: expandedAccordion === "project-diseno",
        onToggle: () => toggleAccordion("project-diseno"),
        children: [
          { icon: Calendar, label: "Cronograma", href: "/design/timeline" },
        ],
      },
      {
        icon: Building,
        label: "Obra",
        isAccordion: true,
        expanded: expandedAccordion === "obra",
        onToggle: () => toggleAccordion("obra"),
        children: [
          {
            icon: Home,
            label: "Resumen de Obra",
            href: "/construction/dashboard",
          },
          {
            icon: Calculator,
            label: "Presupuestos",
            href: "/construction/budgets",
          },
          {
            icon: Package,
            label: "Materiales",
            href: "/construction/materials",
          },
          { icon: FileText, label: "Bitácora", href: "/construction/logs" },
          { icon: Users, label: "Personal", href: "/construction/personnel" },
        ],
      },
      {
        icon: DollarSign,
        label: "Finanzas",
        isAccordion: true,
        expanded: expandedAccordion === "finanzas",
        onToggle: () => toggleAccordion("finanzas"),
        children: [
          { icon: Home, label: "Resumen de Finanzas", href: "/finanzas" },
          { icon: DollarSign, label: "Movimientos", href: "/movimientos" },
          {
            icon: Settings,
            label: "Preferencias de Finanzas",
            href: "/preferencias",
          },
        ],
      },
      {
        icon: Users,
        label: "Comercialización",
        href: "#",
        onClick: () =>
          handleContextChange(
            "commercialization",
            "/commercialization/dashboard",
          ),
      },
      {
        icon: ArrowLeft,
        label: "Volver a Organización",
        href: "#",
        onClick: () =>
          handleContextChange("organization", "/organization/dashboard"),
      },
    ],
    design: [
      { icon: Home, label: "Dashboard", href: "/design/dashboard" },
      {
        icon: Calendar,
        label: "Cronograma de Diseño",
        href: "/design/timeline",
      },
      { icon: FileText, label: "Moodboard", href: "/design/moodboard" },
      {
        icon: FolderOpen,
        label: "Documentación técnica",
        href: "/design/documentacion",
      },
      {
        icon: ArrowLeft,
        label: "Volver al Proyecto",
        href: "#",
        onClick: () => handleContextChange("project", "/project/dashboard"),
      },
    ],
    construction: [
      { icon: Home, label: "Resumen", href: "/construction/dashboard" },
      {
        icon: Calculator,
        label: "Presupuestos",
        href: "/construction/budgets",
      },
      { icon: FileText, label: "Bitácora", href: "/bitacora" },
      {
        icon: ArrowLeft,
        label: "Volver al Proyecto",
        href: "#",
        onClick: () => handleContextChange("project", "/project/dashboard"),
      },
    ],
    commercialization: [
      { icon: Home, label: "Dashboard", href: "/commercialization/dashboard" },
      {
        icon: Building,
        label: "Listado de unidades",
        href: "/commercialization/unidades",
      },
      {
        icon: Users,
        label: "Clientes interesados",
        href: "/commercialization/clientes",
      },
      {
        icon: FileText,
        label: "Estadísticas de venta",
        href: "/commercialization/estadisticas",
      },
      {
        icon: ArrowLeft,
        label: "Volver al Proyecto",
        href: "#",
        onClick: () => handleContextChange("project", "/project/dashboard"),
      },
    ],
    admin: [
      {
        icon: Home,
        label: "Resumen de Administración",
        href: "/admin/dashboard",
      },
      {
        icon: Users,
        label: "Comunidad",
        isAccordion: true,
        expanded: expandedAccordion === "admin-comunidad",
        onToggle: () => toggleAccordion("admin-comunidad"),
        children: [
          {
            icon: Building,
            label: "Organizaciones",
            href: "/admin/organizations",
          },
          { icon: Users, label: "Usuarios", href: "/admin/users" },
        ],
      },
      {
        icon: CheckSquare,
        label: "Tareas",
        isAccordion: true,
        expanded: expandedAccordion === "admin-tareas",
        onToggle: () => toggleAccordion("admin-tareas"),
        children: [
          { icon: CheckSquare, label: "Tareas", href: "/admin/tasks" },
          {
            icon: Zap,
            label: "Tareas Generadas",
            href: "/admin/generated-tasks",
          },
          {
            icon: Settings,
            label: "Parámetros",
            href: "/admin/task-parameters",
          },
          {
            icon: FileCode,
            label: "Categorías de Tareas",
            href: "/admin/task-categories-templates",
          },
        ],
      },
      {
        icon: Package,
        label: "Materiales",
        isAccordion: true,
        expanded: expandedAccordion === "admin-materiales",
        onToggle: () => toggleAccordion("admin-materiales"),
        children: [
          { icon: Package, label: "Materiales", href: "/admin/materials" },
          {
            icon: Tag,
            label: "Categorías de Materiales",
            href: "/admin/material-categories",
          },
        ],
      },
    ],
  };

  const navigationItems =
    sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] ||
    sidebarContexts.organization;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col w-full h-full"
      style={{ backgroundColor: "var(--menues-bg)" }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center justify-between px-4 border-b"
        style={{ borderColor: "var(--menues-border)" }}
      >
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--menues-fg)" }}
        >
          Archub
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-transparent"
          style={{ color: "var(--menues-fg)" }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Organization and Project Selectors */}
      <div
        className="border-b p-4 space-y-3"
        style={{ borderColor: "var(--menues-border)" }}
      >
        {/* Organization Selector */}
        <div>
          <div
            className="text-xs font-medium opacity-70 mb-2"
            style={{ color: "var(--menues-fg)" }}
          >
            Organización activa:
          </div>
          <button
            onClick={() =>
              setExpandedAccordion(
                expandedAccordion === "org-selector" ? null : "org-selector",
              )
            }
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:opacity-80"
            style={{
              color: "var(--menues-fg)",
              backgroundColor: "transparent",
              borderColor: "var(--menues-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">
                {currentOrganization?.name || "Sin organización"}
              </span>
            </div>
            {expandedAccordion === "org-selector" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedAccordion === "org-selector" && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {userData?.organizations?.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-80"
                  style={{
                    color: "var(--menues-fg)",
                    backgroundColor:
                      org.id === currentOrganization?.id
                        ? "var(--accent)"
                        : "transparent",
                    opacity: org.id === currentOrganization?.id ? 1 : 0.8,
                  }}
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === currentOrganization?.id && (
                    <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div>
          <div
            className="text-xs font-medium opacity-70 mb-2"
            style={{ color: "var(--menues-fg)" }}
          >
            Proyecto activo:
          </div>
          <button
            onClick={() =>
              setExpandedAccordion(
                expandedAccordion === "project-selector"
                  ? null
                  : "project-selector",
              )
            }
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:opacity-80"
            style={{
              color: "var(--menues-fg)",
              backgroundColor: "transparent",
              borderColor: "var(--menues-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="truncate">
                {currentProject?.name || "Sin proyecto"}
              </span>
            </div>
            {expandedAccordion === "project-selector" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedAccordion === "project-selector" && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-80"
                  style={{
                    color: "var(--menues-fg)",
                    backgroundColor:
                      project.id === currentProject?.id
                        ? "var(--accent)"
                        : "transparent",
                    opacity: project.id === currentProject?.id ? 1 : 0.8,
                  }}
                >
                  <span className="truncate">{project.name}</span>
                  {project.id === currentProject?.id && (
                    <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Context Title */}
        <div className="mb-4">
          <h2
            className="text-sm font-medium opacity-70"
            style={{ color: "var(--menues-fg)" }}
          >
            {currentSidebarContext === "organization" && "Organización"}
            {currentSidebarContext === "project" && "Proyecto"}
            {currentSidebarContext === "design" && "Diseño"}
            {currentSidebarContext === "construction" && "Construcción"}
            {currentSidebarContext === "commercialization" &&
              "Comercialización"}
            {currentSidebarContext === "admin" && "Administración"}
          </h2>
        </div>

        <nav
          className={`space-y-0.5 transition-transform duration-300 ${
            isAnimating && animationDirection === "left"
              ? "transform -translate-x-full"
              : isAnimating && animationDirection === "right"
                ? "transform translate-x-full"
                : "transform translate-x-0"
          }`}
        >
          {navigationItems.map((item: any, index: number) => (
            <div key={`${item.label}-${index}`}>
              {/* Main Button */}
              <button
                onClick={
                  item.isAccordion
                    ? item.onToggle
                    : item.onClick || (() => handleNavigation(item.href))
                }
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 hover:bg-opacity-10 active:bg-gray-100 active:bg-opacity-20"
                style={{
                  color: "var(--menues-fg)",
                  backgroundColor: "transparent",
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.isAccordion && (
                  <div className="ml-auto">
                    {item.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </button>

              {/* Accordion Children */}
              {item.isAccordion && item.expanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.children?.map((child: any, childIndex: number) => (
                    <button
                      key={`${child.label}-${childIndex}`}
                      onClick={() => handleNavigation(child.href)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-100 hover:bg-opacity-10 active:bg-gray-100 active:bg-opacity-20"
                      style={{
                        color: "var(--menues-fg)",
                        backgroundColor: "transparent",
                        opacity: 0.9,
                      }}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* General Section */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--menues-border)' }}>
          <div className="mb-4">
            <h3 className="text-sm font-medium opacity-70" style={{ color: 'var(--menues-fg)' }}>
              General
            </h3>
          </div>
          
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavigation('/perfil')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
              style={{ color: 'var(--menues-fg)' }}
            >
              <UserCircle className="h-4 w-4" />
              <span className="text-sm">Mi Perfil</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/tasks')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
              style={{ color: 'var(--menues-fg)' }}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm">Tareas</span>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/admin/dashboard', 'admin')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                style={{ color: 'var(--menues-fg)' }}
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm">Administración</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context Switcher - Bottom */}
      <div
        className="border-t p-4"
        style={{ borderColor: "var(--menues-border)" }}
      >
        <div className="space-y-2 mb-4">
          <div
            className="text-xs font-medium opacity-70"
            style={{ color: "var(--menues-fg)" }}
          >
            Cambiar contexto:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleNavigation("/organization/dashboard", "organization")
              }
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
              style={{
                color: "var(--menues-fg)",
                opacity: currentSidebarContext === "organization" ? 1 : 0.6,
              }}
            >
              <Building className="h-4 w-4" />
              Organización
            </button>

            <button
              onClick={() => handleNavigation("/project/dashboard", "project")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
              style={{
                color: "var(--menues-fg)",
                opacity: currentSidebarContext === "project" ? 1 : 0.6,
              }}
            >
              <FileText className="h-4 w-4" />
              Proyecto
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavigation("/admin/dashboard", "admin")}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
                style={{
                  color: "var(--menues-fg)",
                  opacity: currentSidebarContext === "admin" ? 1 : 0.6,
                }}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div
          className="border-t pt-4"
          style={{ borderColor: "var(--menues-border)" }}
        >
          <div
            className={`flex gap-3 ${isAdmin ? "justify-between" : "justify-center"}`}
          >
            <button
              onClick={() => handleNavigation("/perfil")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{
                color: "var(--menues-fg)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <UserCircle className="h-4 w-4" />
              <span className="text-sm">Perfil</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavigation("/admin/dashboard", "admin")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: "var(--menues-fg)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm">Admin</span>
              </button>
            )}

            <button
              onClick={() => handleNavigation("/tasks")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{
                color: "var(--menues-fg)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm">Tareas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
