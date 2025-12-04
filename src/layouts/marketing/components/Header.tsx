import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, LogOut, User, BookOpen, Sparkles, HelpCircle, Mail, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Componente de botón estilo dashboard mobile
function MarketingMobileMenuButton({
  icon: Icon,
  label,
  onClick,
  href,
  testId,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  href?: string;
  testId?: string;
}) {
  const content = (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        "border-b border-[var(--main-sidebar-border)]",
        "hover:bg-[var(--main-sidebar-button-hover-bg)]"
      )}
    >
      <Icon className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
      <span className="flex-1 text-base text-[var(--main-sidebar-fg)]">
        {label}
      </span>
    </button>
  );

  return content;
}

export function Header({ navigation, hasAnnouncement = false, announcementHeight = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, initialized, initialize, logout } = useAuthStore();
  const [location, setLocation] = useLocation();
  
  // Usar navegación por defecto agnóstica (siempre consistente)
  const navItems = navigation || DEFAULT_NAVIGATION;

  useEffect(() => {
    if (!initialized && !loading) {
      initialize();
    }
  }, [initialize, initialized, loading]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email || "Usuario";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleNavigate = (href: string) => {
    setMobileMenuOpen(false);
    // Si es un anchor, hacer scroll con animación
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        // Agregar animación al elemento antes de hacer scroll
        element.animate([
          { transform: 'translateY(-20px)', opacity: 0.7 },
          { transform: 'translateY(0)', opacity: 1 }
        ], {
          duration: 800,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        });
        
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    // Si estamos en la landing (/), hacer scroll al top
    // Si estamos en otra página, navegar a la landing usando wouter
    if (location === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      e.preventDefault();
      setLocation('/');
    }
  };

  const getIconForNavItem = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('inicio')) return Home;
    if (lower.includes('curso')) return BookOpen;
    if (lower.includes('fundador')) return Sparkles;
    if (lower.includes('precio')) return CreditCard;
    if (lower.includes('característica')) return Sparkles;
    if (lower.includes('ayuda') || lower.includes('faq')) return HelpCircle;
    if (lower.includes('contacto')) return Mail;
    return BookOpen;
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

  const renderMobileMenu = () => {
    if (!mobileMenuOpen) return null;

    return createPortal(
      <div 
        className="fixed inset-0" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} 
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className="fixed inset-0 flex flex-row overflow-hidden"
          style={{ backgroundColor: 'var(--main-sidebar-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header del menú */}
            <div className="flex items-center h-14 px-4 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)]">
              <h1 className="text-lg font-semibold flex-1 !text-white">
                Menú
              </h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
              </button>
            </div>

            {/* Contenido del menú */}
            <div className="flex-1 overflow-y-auto">
              <nav>
                {/* Botones de autenticación */}
                {user ? (
                  <>
                    {/* Dashboard Button */}
                    <div onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/home">
                        <MarketingMobileMenuButton
                          icon={Home}
                          label="Dashboard"
                          testId="button-mobile-dashboard"
                        />
                      </Link>
                    </div>

                    {/* Logout Button */}
                    <MarketingMobileMenuButton
                      icon={LogOut}
                      label="Cerrar sesión"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      testId="button-mobile-logout"
                    />
                  </>
                ) : (
                  <>
                    {/* Login Button */}
                    <div onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/login">
                        <MarketingMobileMenuButton
                          icon={User}
                          label="Iniciar Sesión"
                          testId="button-mobile-login"
                        />
                      </Link>
                    </div>

                    {/* Register Button */}
                    <div onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/register">
                        <MarketingMobileMenuButton
                          icon={User}
                          label="Comenzar Gratis"
                          testId="button-mobile-register"
                        />
                      </Link>
                    </div>
                  </>
                )}

                {/* Espacio vacío del tamaño de un botón */}
                <div className="h-12" />

                {/* Links de navegación */}
                {navItems && navItems.length > 0 && navItems.map((item) => {
                  const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                  const ItemIcon = getIconForNavItem(item.label);
                  
                  if (isSamePageAnchor) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => handleNavigate(item.href)}
                      >
                        <MarketingMobileMenuButton
                          icon={ItemIcon}
                          label={item.label}
                          testId={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      </a>
                    );
                  }
                  
                  return (
                    <div 
                      key={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href={item.href}>
                        <MarketingMobileMenuButton
                          icon={ItemIcon}
                          label={item.label}
                          testId={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>,
      document.body
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
              onClick={() => setMobileMenuOpen(true)}
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

      {/* Mobile Menu Portal */}
      {renderMobileMenu()}
    </>
  );
}
