import React from "react";
import {
  X,
  Building,
  FolderOpen,
  UserCircle,
  CheckSquare,
  Shield,
  Home,
  Mail,
  Activity,
  Users,
  Settings,
  DollarSign,
  Hammer,
  ClipboardCheck,
  Calendar,
  Briefcase,
  Calculator,
  Wrench,
  FileText,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const currentOrganization = data?.organization;
  const isAdmin = data?.role?.name === "super_admin" || false;

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      setSidebarContext(newContext as any);
    }
    navigate(href);
    onClose();
  };

  // Simple navigation items based on context
  const organizationItems = [
    { icon: Home, label: "Resumen de la Organización", href: "/organization/dashboard" },
    { icon: Briefcase, label: "Proyectos", href: "/proyectos" },
    { icon: Mail, label: "Contactos", href: "/organization/contactos" },
    { icon: Activity, label: "Actividad", href: "/organization/actividad" },
    { icon: Users, label: "Miembros", href: "/organization/miembros" },
    { icon: Settings, label: "Gestión de Organizaciones", href: "/organizaciones" },
  ];

  const projectItems = [
    { icon: Home, label: "Resumen del Proyecto", href: "/project/dashboard" },
    { icon: DollarSign, label: "Movimientos", href: "/finanzas/movimientos" },
    { icon: Settings, label: "Preferencias de Finanzas", href: "/finanzas/preferencias" },
    { icon: Home, label: "Resumen de Obra", href: "/construction/dashboard" },
    { icon: Calculator, label: "Presupuestos", href: "/construction/budgets" },
    { icon: Wrench, label: "Materiales", href: "/construction/materials" },
    { icon: FileText, label: "Bitácora", href: "/construction/logs" },
    { icon: HardHat, label: "Personal", href: "/construction/personnel" },
    { icon: ClipboardCheck, label: "Gestión de Tareas", href: "/tasks" },
    { icon: Calendar, label: "Cronograma", href: "/design/timeline" },
  ];

  const navigationItems = currentSidebarContext === 'project' ? projectItems : organizationItems;

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

      {/* Organization Info */}
      <div className="border-b px-4 py-4" style={{ borderColor: 'var(--menues-border)' }}>
        <div className="flex items-center gap-3">
          <Building className="h-5 w-5" style={{ color: 'var(--menues-fg)' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--menues-fg)' }}>
              {currentOrganization?.name || 'Sin organización'}
            </div>
            <div className="text-xs opacity-70" style={{ color: 'var(--menues-fg)' }}>
              {currentSidebarContext === 'organization' ? 'Organización' : 'Proyecto'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 py-3">
        <nav className="space-y-1">
          {navigationItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
              style={{
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* General Section */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--menues-border)' }}>
          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/perfil')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Mi Perfil</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/tasks')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm font-medium">Tareas</span>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/admin/dashboard', 'admin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                style={{ 
                  color: 'var(--menues-fg)',
                  backgroundColor: 'transparent'
                }}
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Administración</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}