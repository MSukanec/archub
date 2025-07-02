import React, { useState } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Building,
  FolderOpen,
  Check,
  UserCircle,
  CheckSquare,
  Shield,
  // Import all icons needed
  Home,
  Mail,
  Activity,
  Users,
  Settings,
  DollarSign,
  Hammer,
  ClipboardCheck,
  Calendar,
  BarChart3,
  FileText,
  Briefcase,
  Calculator,
  Wrench,
  HardHat,
  TrendingUp,
  Map,
  Zap,
  PenTool,
  Layers,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [location, navigate] = useLocation();
  const { data } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const currentOrganization = data?.organization;
  const currentProject = null; // Will be available from userData in the future
  const organizations = data?.organizations || [];
  const projects: any[] = []; // Will be available from userData in the future
  const isAdmin = data?.role?.name === "super_admin";

  // Sidebar contexts with navigation items
  const sidebarContexts = {
    organization: [
      { icon: Home, label: "Resumen de la Organización", href: "/organization/dashboard" },
      { icon: Briefcase, label: "Proyectos", href: "/proyectos" },
      { icon: Mail, label: "Contactos", href: "/organization/contactos" },
      { icon: Activity, label: "Actividad", href: "/organization/actividad" },
      { icon: Users, label: "Miembros", href: "/organization/miembros" },
      { icon: Settings, label: "Gestión de Organizaciones", href: "/organizaciones" },
    ],
    project: [
      { icon: Home, label: "Resumen del Proyecto", href: "/project/dashboard" },
      {
        icon: DollarSign,
        label: "Finanzas",
        isAccordion: true,
        expanded: false,
        children: [
          { icon: DollarSign, label: "Movimientos", href: "/finanzas/movimientos" },
          { icon: Settings, label: "Preferencias de Finanzas", href: "/finanzas/preferencias" },
        ],
      },
      {
        icon: Hammer,
        label: "Obra",
        isAccordion: true,
        expanded: false,
        children: [
          { icon: Home, label: "Resumen de Obra", href: "/construction/dashboard" },
          { icon: Calculator, label: "Presupuestos", href: "/construction/budgets" },
          { icon: Wrench, label: "Materiales", href: "/construction/materials" },
          { icon: FileText, label: "Bitácora", href: "/construction/logs" },
          { icon: HardHat, label: "Personal", href: "/construction/personnel" },
        ],
      },
      { icon: ClipboardCheck, label: "Gestión de Tareas", href: "/tasks" },
      { icon: Calendar, label: "Cronograma", href: "/design/timeline" },
    ],
  };

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      setSidebarContext(newContext as any);
    }
    navigate(href);
    onClose();
  };

  const navigationItems = sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] || sidebarContexts.organization;

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full h-full" style={{ backgroundColor: 'var(--menues-bg)' }}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>
          Archub
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-transparent"
          style={{ color: 'var(--menues-fg)' }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Organization and Project Selectors */}
      <div className="border-b px-4 py-4 space-y-3" style={{ borderColor: 'var(--menues-border)' }}>
        {/* Organization Selector */}
        <div>
          <div className="text-xs font-medium opacity-70 mb-2" style={{ color: 'var(--menues-fg)' }}>
            Organización activa:
          </div>
          <button
            onClick={() => setExpandedAccordion(expandedAccordion === 'org-selector' ? null : 'org-selector')}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            style={{
              color: 'var(--menues-fg)',
              backgroundColor: 'transparent',
              borderColor: 'var(--menues-border)'
            }}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">{currentOrganization?.name || 'Sin organización'}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedAccordion === 'org-selector' && "rotate-180")} />
          </button>
        </div>

        {/* Project Selector */}
        <div>
          <div className="text-xs font-medium opacity-70 mb-2" style={{ color: 'var(--menues-fg)' }}>
            Proyecto activo:
          </div>
          <button
            onClick={() => setExpandedAccordion(expandedAccordion === 'project-selector' ? null : 'project-selector')}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            style={{
              color: 'var(--menues-fg)',
              backgroundColor: 'transparent',
              borderColor: 'var(--menues-border)'
            }}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="truncate">{currentProject?.name || 'Sin proyecto'}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedAccordion === 'project-selector' && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Navigation Menu - No scrollbar needed */}
      <div className="flex-1 px-4 py-3">
        {/* Context Title */}
        <div className="mb-4">
          <h2 className="text-sm font-medium opacity-70" style={{ color: 'var(--menues-fg)' }}>
            {currentSidebarContext === 'organization' && 'Organización'}
            {currentSidebarContext === 'project' && 'Proyecto'}
          </h2>
        </div>
        
        <nav className="space-y-0.5">
          {navigationItems.map((item: any, index: number) => (
            <div key={`${item.label}-${index}`}>
              {/* Main Button */}
              <button
                onClick={item.isAccordion ? item.onToggle : (() => handleNavigation(item.href))}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                style={{
                  color: 'var(--menues-fg)',
                  backgroundColor: 'transparent'
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.isAccordion && (
                  <div className="ml-auto">
                    {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                      style={{
                        color: 'var(--menues-fg)',
                        backgroundColor: 'transparent',
                        opacity: 0.9
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
    </div>
  );
}