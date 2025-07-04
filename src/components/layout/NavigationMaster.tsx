import { Building, FolderOpen, Users, Activity, Crown, Palette, Hammer, DollarSign, ShoppingCart, Home, User, ArrowLeft } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavigationMasterProps {}

export function NavigationMaster({}: NavigationMasterProps) {
  const { isExpanded, toggleSidebar, currentContext, setSidebarContext } = useSidebarStore();
  const [, navigate] = useLocation();

  const handleNavigate = (context: any, path?: string) => {
    setSidebarContext(context);
    if (path) {
      navigate(path);
    }
  };

  const handleBack = () => {
    setSidebarContext('master');
  };

  const renderMasterSidebar = () => (
    <>
      {/* Header */}
      <div className="p-2">
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={toggleSidebar}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Archub</span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 space-y-1">
        {/* Resúmenes */}
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('organization-dashboard', '/organization/dashboard')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Resumen de Organización</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('project-dashboard', '/project/dashboard')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Resumen de Proyecto</span>
          )}
        </button>
        
        <div className="my-2">
          <Separator className="bg-[--menues-border]" />
        </div>

        {/* Sidebars Secundarios */}
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('organization')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Organización</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('project')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Proyecto</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('design')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Diseño</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('construction')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Hammer className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Obra</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('finance')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Finanzas</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('marketing')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Comercialización</span>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="p-2 space-y-1">
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => handleNavigate('admin')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Administración</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/perfil')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Perfil</span>
          )}
        </button>
      </div>
    </>
  );

  const renderOrganizationSidebar = () => (
    <>
      {/* Header */}
      <div className="p-2">
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={handleBack}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Volver</span>
          )}
        </button>
      </div>

      <div className="flex-1 px-2 space-y-1">
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/proyectos')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Proyectos</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/organization/contactos')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Contactos</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/organization/activity')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Actividad</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/organization/members')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Miembros</span>
          )}
        </button>

        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/organizations')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Gestión de Organizaciones</span>
          )}
        </button>
      </div>

      <div className="p-2">
        <button
          className={cn(
            'relative flex items-center transition-all duration-300 w-8 h-8',
            isExpanded && 'w-full',
            'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
          )}
          onClick={() => navigate('/perfil')}
          style={{ borderRadius: '4px' }}
        >
          <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          {isExpanded && (
            <span className="ml-8 text-sm font-medium whitespace-nowrap">Perfil</span>
          )}
        </button>
      </div>
    </>
  );

  const renderCurrentSidebar = () => {
    switch (currentContext) {
      case 'organization':
        return renderOrganizationSidebar();
      case 'project':
        // TODO: Implementar proyecto sidebar
        return renderMasterSidebar();
      case 'design':
        // TODO: Implementar diseño sidebar
        return renderMasterSidebar();
      case 'construction':
        // TODO: Implementar obra sidebar
        return renderMasterSidebar();
      case 'finance':
        // TODO: Implementar finanzas sidebar
        return renderMasterSidebar();
      case 'marketing':
        // TODO: Implementar comercialización sidebar
        return renderMasterSidebar();
      case 'admin':
        // TODO: Implementar admin sidebar
        return renderMasterSidebar();
      default:
        return renderMasterSidebar();
    }
  };

  return (
    <div className={cn(
      'fixed top-0 left-0 h-full bg-[--menues-bg] border-r border-[--menues-border] z-50 transition-all duration-300',
      isExpanded ? 'w-[200px]' : 'w-[48px]'
    )}>
      {renderCurrentSidebar()}
    </div>
  );
}