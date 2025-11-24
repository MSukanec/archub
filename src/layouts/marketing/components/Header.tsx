import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";

interface HeaderProps {
  navigation?: Array<{ label: string; href: string }>;
  transparent?: boolean;
}

export function Header({ navigation, transparent = false }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, loading, initialized, initialize, logout } = useAuthStore();

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

  const renderAuthActions = () => {
    if (loading) return null;

    if (user) {
      const buttonClasses = transparent
        ? "h-8 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20"
        : "h-8 px-3";
      
      const avatarClasses = transparent
        ? "h-8 w-8 cursor-pointer border-2 border-white/20"
        : "h-8 w-8 cursor-pointer";
      
      const avatarFallbackClasses = transparent
        ? "text-xs bg-white/10 text-white"
        : "text-xs bg-card";

      return (
        <div className="flex items-center space-x-3">
          <Link href="/home">
            <Button size="sm" className={buttonClasses} data-testid="button-dashboard">
              Ingresar
            </Button>
          </Link>
          <div className="flex items-center space-x-2 group relative">
            <Avatar className={avatarClasses} data-testid="avatar-user">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className={avatarFallbackClasses}>
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

    if (transparent) {
      return (
        <div className="flex items-center space-x-3">
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
    }

    return (
      <div className="flex items-center space-x-3">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="h-8 px-3" data-testid="button-login">
            Iniciar Sesión
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="h-8 px-3" data-testid="button-register">
            Comenzar Gratis
          </Button>
        </Link>
      </div>
    );
  };

  const headerClasses = transparent
    ? "fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20"
    : "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";

  const logoTextClasses = transparent
    ? "font-bold text-xl text-white"
    : "font-bold text-lg";

  const navLinkClasses = transparent
    ? "text-sm text-white/80 transition-colors hover:text-white font-medium"
    : "text-sm text-muted-foreground transition-colors hover:text-foreground";

  const mobileMenuButtonClasses = transparent
    ? "md:hidden text-white hover:bg-white/10"
    : "md:hidden";

  const headerHeight = transparent ? "h-16" : "h-14";

  return (
    <header className={headerClasses}>
      <div className={`container mx-auto px-6 ${headerHeight} flex items-center justify-between`}>
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <img 
              src="/Seencel512_b.png" 
              alt="Seencel" 
              className={transparent ? "h-8 w-8 object-contain" : "h-7 w-7 object-contain"}
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
          {/* Mobile Menu */}
          {navigation && navigation.length > 0 && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={mobileMenuButtonClasses}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => {
                    const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                    
                    if (isSamePageAnchor) {
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
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
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                        data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {renderAuthActions()}
        </div>
      </div>
    </header>
  );
}
