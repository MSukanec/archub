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

interface PublicHeaderProps {
  navigation?: Array<{ label: string; href: string }>;
}

export function PublicHeader({ navigation }: PublicHeaderProps) {
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
      return (
        <div className="flex items-center space-x-3">
          <Link href="/home">
            <Button size="sm" className="h-8 px-3" data-testid="button-dashboard">
              Ingresar
            </Button>
          </Link>
          <div className="flex items-center space-x-2 group relative">
            <Avatar className="h-8 w-8 cursor-pointer" data-testid="avatar-user">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-card">
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <img 
              src="/Seencel512_b.png" 
              alt="Seencel" 
              className="h-7 w-7 object-contain"
            />
            <span className="font-bold text-lg">Seencel</span>
          </Link>
          
          {/* Desktop Navigation */}
          {navigation && navigation.length > 0 && (
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                // Only use <a> for same-page hash anchors (starting with # without /)
                // Use <Link> for everything else (routes and cross-page hashes like /#features)
                const isSamePageAnchor = item.href.startsWith('#') && !item.href.includes('/');
                
                if (isSamePageAnchor) {
                  return (
                    <a 
                      key={item.href}
                      href={item.href} 
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                  className="md:hidden"
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
                    // Only use <a> for same-page hash anchors (starting with # without /)
                    // Use <Link> for everything else (routes and cross-page hashes like /#features)
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

          {/* Authentication Actions (automatic) */}
          {renderAuthActions()}
        </div>
      </div>
    </header>
  );
}
