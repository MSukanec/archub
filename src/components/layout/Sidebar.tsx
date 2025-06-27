import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { 
  Home, Users, Building, FileText, DollarSign, FolderOpen, Mail, Activity, 
  Settings, UserCircle, ChevronDown, ChevronRight, Shield, User
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isExpanded, openAccordions, setExpanded, toggleAccordion } = useSidebarStore();

  const organizacionItems = [
    { icon: Home, label: 'Resumen', href: '/organization/dashboard' },
    { icon: FolderOpen, label: 'Proyectos', href: '/proyectos' },
    { icon: Mail, label: 'Contactos', href: '/organization/contactos' },
    { icon: Activity, label: 'Actividad', href: '/organization/activity' },
    { icon: Users, label: 'Miembros', href: '/organization/members' },
    { icon: Settings, label: 'Preferencias', href: '/preferencias' },
  ];

  const proyectoItems = [
    { icon: Home, label: 'Dashboard', href: '/project/dashboard' },
    { icon: FileText, label: 'Diseño', href: '/design/dashboard' },
  ];

  const obraItems = [
    { label: 'Resumen de Obra', href: '/construction/dashboard' },
    { label: 'Bitácora', href: '/bitacora' },
  ];

  const finanzasItems = [
    { label: 'Resumen de Finanzas', href: '/finance/dashboard' },
    { label: 'Movimientos', href: '/movimientos' },
  ];

  const isOrganizacionOpen = openAccordions.includes('organizacion');
  const isProyectoOpen = openAccordions.includes('proyecto');

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen bg-[var(--menues-bg)] border-r border-[var(--menues-border)] transition-all duration-300 z-50 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[64px]"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Context Switcher */}
      <div className="p-3 border-b border-[var(--menues-border)]">
        <button
          disabled
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors text-[var(--menues-fg)] opacity-50 cursor-not-allowed",
            !isExpanded && "justify-center"
          )}
        >
          <Shield className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span>ADMINISTRACIÓN</span>}
        </button>
        <button
          disabled
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors text-[var(--menues-fg)] opacity-50 cursor-not-allowed mt-1",
            !isExpanded && "justify-center"
          )}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span>PERFIL</span>}
        </button>
      </div>

      {/* GENERAL Section */}
      <div className="p-3 border-b border-[var(--menues-border)]">
        <div className="text-xs font-semibold text-[var(--menues-fg)] opacity-60">
          {isExpanded ? 'GENERAL' : ''}
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* ORGANIZACIÓN Accordion */}
          <div>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
                !isExpanded && "justify-center"
              )}
              onClick={() => toggleAccordion('organizacion')}
            >
              <Building className="w-4 h-4 flex-shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">ORGANIZACIÓN</span>
                  {isOrganizacionOpen ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {isOrganizacionOpen && isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {organizacionItems.map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                      location === item.href
                        ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                        : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="w-3 h-3 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PROYECTO Accordion */}
          <div>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
                !isExpanded && "justify-center"
              )}
              onClick={() => toggleAccordion('proyecto')}
            >
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">PROYECTO</span>
                  {isProyectoOpen ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {isProyectoOpen && isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {/* Dashboard y Diseño */}
                {proyectoItems.map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                      location === item.href
                        ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                        : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="w-3 h-3 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}

                {/* Obra Group */}
                <div className="ml-2">
                  <div className="flex items-center gap-2 p-2 text-xs font-medium text-[var(--menues-fg)] opacity-80">
                    <Building className="w-3 h-3 flex-shrink-0" />
                    <span>Obra</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {obraItems.map((item, index) => (
                      <button
                        key={index}
                        className={cn(
                          "w-full flex items-center p-2 rounded-md text-xs transition-colors",
                          location === item.href
                            ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                            : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        <span className="text-left">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Finanzas Group */}
                <div className="ml-2">
                  <div className="flex items-center gap-2 p-2 text-xs font-medium text-[var(--menues-fg)] opacity-80">
                    <DollarSign className="w-3 h-3 flex-shrink-0" />
                    <span>Finanzas</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {finanzasItems.map((item, index) => (
                      <button
                        key={index}
                        className={cn(
                          "w-full flex items-center p-2 rounded-md text-xs transition-colors",
                          location === item.href
                            ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                            : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        <span className="text-left">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comercialización */}
                <button
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                    location === '/commercialization/dashboard'
                      ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                      : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                  )}
                  onClick={() => navigate('/commercialization/dashboard')}
                >
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1 text-left">Comercialización</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[var(--menues-border)] p-2">
        <div className="space-y-1">
          <button
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-xs transition-colors",
              location === '/configuracion'
                ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
              !isExpanded && "justify-center"
            )}
            onClick={() => navigate('/configuracion')}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {isExpanded && <span>Configuración</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-xs transition-colors",
              location === '/perfil'
                ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
              !isExpanded && "justify-center"
            )}
            onClick={() => navigate('/perfil')}
          >
            {userData?.user?.avatar_url ? (
              <img 
                src={userData.user.avatar_url} 
                alt="Avatar" 
                className="w-4 h-4 rounded-full flex-shrink-0"
              />
            ) : (
              <UserCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {isExpanded && <span>Mi Perfil</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}