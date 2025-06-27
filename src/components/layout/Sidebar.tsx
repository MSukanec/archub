import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { 
  Home, Users, Building, FileText, DollarSign, FolderOpen, Mail, Activity, 
  Settings, UserCircle, ChevronDown, ChevronRight, Shield, User, MoreHorizontal
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isExpanded, openAccordions, context, setExpanded, toggleAccordion, setContext } = useSidebarStore();

  const accordionSections = {
    organizacion: {
      icon: Building,
      label: 'ORGANIZACIÓN',
      items: [
        { icon: Home, label: 'Resumen', href: '/organization/dashboard' },
        { icon: FolderOpen, label: 'Proyectos', href: '/proyectos' },
        { icon: Mail, label: 'Contactos', href: '/organization/contactos' },
        { icon: Activity, label: 'Actividad', href: '/organization/activity' },
        { icon: Users, label: 'Miembros', href: '/organization/members' },
        { icon: Settings, label: 'Preferencias', href: '/preferencias' },
      ]
    },
    proyecto: {
      icon: FolderOpen,
      label: 'PROYECTO',
      items: [
        { icon: Home, label: 'Dashboard', href: '/project/dashboard' },
        { icon: FileText, label: 'Diseño', href: '/design/dashboard' },
        { 
          icon: Building, 
          label: 'Obra', 
          href: '/construction/dashboard',
          subItems: [
            { label: 'Resumen de Obra', href: '/construction/dashboard' },
            { label: 'Bitácora', href: '/bitacora' },
          ]
        },
        { 
          icon: DollarSign, 
          label: 'Finanzas',
          href: '/finance/dashboard',
          subItems: [
            { label: 'Resumen de Finanzas', href: '/finance/dashboard' },
            { label: 'Movimientos', href: '/movimientos' },
          ]
        },
        { icon: Users, label: 'Comercialización', href: '/commercialization/dashboard' },
      ]
    }
  };

  const contextButtons = [
    { id: 'admin', icon: Shield, label: 'ADMINISTRACIÓN', disabled: true },
    { id: 'profile', icon: User, label: 'PERFIL', disabled: true },
  ];

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
        {contextButtons.map((btn) => (
          <button
            key={btn.id}
            disabled={btn.disabled}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors",
              btn.disabled 
                ? "text-[var(--menues-fg)] opacity-50 cursor-not-allowed" 
                : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
              !isExpanded && "justify-center"
            )}
            onClick={() => !btn.disabled && setContext(btn.id as any)}
          >
            <btn.icon className="w-4 h-4 flex-shrink-0" />
            {isExpanded && <span>{btn.label}</span>}
          </button>
        ))}
      </div>

      {/* GENERAL Section */}
      <div className="p-3 border-b border-[var(--menues-border)]">
        <div className="text-xs font-semibold text-[var(--menues-fg)] opacity-60 mb-2">
          {isExpanded ? 'GENERAL' : ''}
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {Object.entries(accordionSections).map(([key, section]) => {
            const isOpen = openAccordions.includes(key);
            
            return (
              <div key={key}>
                {/* Accordion Header */}
                <button
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => toggleAccordion(key)}
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left">{section.label}</span>
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      )}
                    </>
                  )}
                </button>

                {/* Accordion Content */}
                {isOpen && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.items.map((item, index) => (
                      <div key={index}>
                        {/* Main Item */}
                        <button
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                            location === item.href
                              ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                              : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                          )}
                          onClick={() => item.href && navigate(item.href)}
                        >
                          <item.icon className="w-3 h-3 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>

                        {/* Sub Items */}
                        {'subItems' in item && item.subItems && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.subItems.map((subItem: any, subIndex: number) => (
                              <button
                                key={subIndex}
                                className={cn(
                                  "w-full flex items-center p-2 rounded-md text-xs transition-colors",
                                  location === subItem.href
                                    ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]"
                                    : "text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)]"
                                )}
                                onClick={() => navigate(subItem.href)}
                              >
                                <span className="text-left">{subItem.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[var(--menues-border)] p-2">
        <div className="space-y-1">
          {/* Settings */}
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

          {/* Profile */}
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