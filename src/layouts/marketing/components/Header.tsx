import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobileMenuStore } from "@/layouts/dashboard/components/MobileMenu/useMobileMenuStore";
import { MobileMenu } from "@/layouts/dashboard/components/MobileMenu/MobileMenu";
interface HeaderProps {
  navigation?: Array<{ label: string; href: string }>;
  hasAnnouncement?: boolean;
  announcementHeight?: number;
}
// Navegación por defecto para páginas públicas (sin "Inicio" - el logo lleva a la landing)
const DEFAULT_NAVIGATION: Array<{ label: string; href: string }> = [
  { label: "Cursos", href: "/cursos" },
  { label: "Fundadores", href: "/founders" },
  { label: "Precios", href: "/precios" },
  { label: "Contacto", href: "/contact" }
];
export function Header({ navigation, hasAnnouncement = false, announcementHeight = 0 }: HeaderProps) {
  const { isOpen: mobileMenuOpen, openMenu, closeMenu } = useMobileMenuStore();
  const { user, loading, initialized, initialize, logout } = useAuthStore();
  const [location, setLocation] = useLocation();
  
  // Usar navegación por defecto agnóstica (siempre consistente)
  const navItems = navigation || DEFAULT_NAVIGATION;
  useEffect(() => {
    if (!initialized && !loading) {
      initialize();
    }
  }, [initialize, initialized, loading]);
  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email || "Usuario";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };
  const handleNavigate = (href: string) => {
    closeMenu();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.animate([
          { transform: 'translateY(-20px)', opacity: 0.7 },
          { transform: 'translateY(0)', opacity: 1 }
        ], {
          duration: 800,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        });
        
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth'});
        }, 100);
      }
    }
  };
  const handleLogoClick = (e: React.MouseEvent) => {
    // Si estamos en la landing (/), hacer scroll al top
    // Si estamos en otra página, navegar a la landing usando wouter
    if (location === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth'});
    } else {
      e.preventDefault();
      setLocation('/');
    }
  };
  const renderAuthActions = () => {
    if (loading) return null;
    if (user) {
      return (
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/home">
            <Button variant="default" size="sm" className="h-8 px-3" data-testid="button-dashboard">
              Ingresar
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer transition-all duration-200 hover:scale-105 outline-none focus:outline-none ring-0 focus:ring-0" data-testid="avatar-user">
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs bg-white/10 text-white">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="bottom" 
              align="end"
              className="w-[200px]"
              sideOffset={8}
              forceMount
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="font-medium text-sm text-foreground">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {user.email}
                </div>
              </div>
              {/* Dashboard Link */}
              <DropdownMenuItem asChild>
                <Link href="/home" className="cursor-pointer">
                  <Home className="h-4 w-4 mr-2" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              {/* Separator */}
              <DropdownMenuSeparator className="bg-border" />
              {/* Logout */}
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return (
      <div className="hidden md:flex items-center space-x-3">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-white/10" data-testid="button-login">
            Iniciar Sesión
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="default" size="sm" className="h-8 px-3" data-testid="button-register">
            Comenzar Gratis
          </Button>
        </Link>
      </div>
    );
  };
  const headerClasses = "fixed left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10";
  const headerHeight = "h-16";
  const logoTextClasses = "font-bold text-xl text-white";
  const navLinkClasses = "text-sm text-white/80 transition-colors hover:text-white font-medium";
  return (
    <>
      <header 
        className={headerClasses}
        style={{ top: hasAnnouncement ? `${announcementHeight}px` : 0 }}
      >
        <div className={`container mx-auto px-6 ${headerHeight} flex items-center justify-between`}>
          <div className="flex items-center space-x-8">
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="logo-home"
            >
              <img 
                src="/seencel-logo-192.png" 
                alt="Seencel" 
                className="h-8 w-8 object-contain"
              />
              <span className={logoTextClasses}>Seencel</span>
            </button>
            
            {/* Desktop Navigation */}
            {navItems && navItems.length > 0 && (
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => {
                  const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                  
                  if (isSamePageAnchor) {
                    return (
                      <a 
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate(item.href);
                        }}
                        className={navLinkClasses}
                        data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item.label}
                      </a>
                    );
                  }
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={navLinkClasses}
                      data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button - siempre visible en mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => openMenu('marketing')}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
            {/* Desktop Auth Actions */}
            {renderAuthActions()}
          </div>
        </div>
      </header>
      {/* Unified Mobile Menu */}
      <MobileMenu />
    </>
  );
}
