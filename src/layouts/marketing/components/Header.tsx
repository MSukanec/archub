import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, Home, LogOut, User, BookOpen, Sparkles, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface HeaderProps {
  navigation?: Array<{ label: string; href: string }>;
}

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

export function Header({ navigation }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, initialized, initialize, logout } = useAuthStore();

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
    // Si es un anchor, hacer scroll
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getIconForNavItem = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('curso')) return BookOpen;
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
            <Button size="sm" className="h-8 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20" data-testid="button-dashboard">
              Ingresar
            </Button>
          </Link>
          <div className="flex items-center space-x-2 group relative">
            <Avatar className="h-8 w-8 cursor-pointer border-2 border-white/20" data-testid="avatar-user">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-white/10 text-white">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-48 py-2 rounded-md shadow-lg z-50 bg-popover border">
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
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
          <Button size="sm" className="h-8 px-3 bg-white text-black hover:bg-white/90" data-testid="button-register">
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
                {navigation && navigation.length > 0 && navigation.map((item) => {
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

  const headerClasses = "fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10";
  const headerHeight = "h-16";
  const logoTextClasses = "font-bold text-xl text-white";
  const navLinkClasses = "text-sm text-white/80 transition-colors hover:text-white font-medium";

  return (
    <>
      <header className={headerClasses}>
        <div className={`container mx-auto px-6 ${headerHeight} flex items-center justify-between`}>
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
              <img 
                src="/Seencel512_b.png" 
                alt="Seencel" 
                className="h-8 w-8 object-contain"
              />
              <span className={logoTextClasses}>Seencel</span>
            </Link>
            
            {/* Desktop Navigation */}
            {navigation && navigation.length > 0 && (
              <nav className="hidden md:flex items-center space-x-6">
                {navigation.map((item) => {
                  const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                  
                  if (isSamePageAnchor) {
                    return (
                      <a 
                        key={item.href}
                        href={item.href} 
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
