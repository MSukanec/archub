import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, Home, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { createPortal } from "react-dom";

interface HeaderProps {
  navigation?: Array<{ label: string; href: string }>;
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

  const getUserDisplayName = (user: any) => {
    if (!user) return "Usuario";
    return user.user_metadata?.full_name || user.email || "Usuario";
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
      <div className="fixed inset-0 z-50 bg-background">
        {/* Header del menú móvil */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/Seencel512_b.png" 
              alt="Seencel" 
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-xl">Seencel</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del menú */}
        <div className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
          {/* User info section - solo si está logueado */}
          {user && (
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-sm bg-primary/10">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getUserDisplayName(user)}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              {/* Dashboard Button */}
              <Link href="/home">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Dashboard</span>
                </button>
              </Link>
            </div>
          )}

          {/* Auth actions para usuarios no logueados */}
          {!loading && !user && (
            <div className="p-6 border-b border-border space-y-2">
              <Link href="/login">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium text-sm">Iniciar Sesión</span>
                </button>
              </Link>
              <Link href="/register">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <span className="font-medium text-sm">Comenzar Gratis</span>
                </button>
              </Link>
            </div>
          )}

          {/* Navigation links */}
          {navigation && navigation.length > 0 && (
            <nav className="flex-1 p-6 space-y-1">
              {navigation.map((item) => {
                const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                
                if (isSamePageAnchor) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <a className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Logout button - solo si está logueado */}
          {user && (
            <div className="p-6 border-t border-border">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="button-logout-mobile"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
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
