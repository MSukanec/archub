import { useEffect, useState } from "react";
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
import { PublicFooter } from "@/layout/public/PublicFooter";
import { Layout } from "@/layout/desktop/Layout";
import { useAuthStore } from "@/stores/authStore";

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  ogImage?: string;
  twitterImage?: string;
}

interface CourseLandingLayoutProps {
  variant: 'public' | 'dashboard';
  children: React.ReactNode;
  headerNavigation?: Array<{ label: string; href: string }>;
  seo?: SEOProps;
  stickyContent?: React.ReactNode;
  heroSlot?: React.ReactNode;
}

function TransparentHeaderLayout({ 
  navigation, 
  children,
  stickyContent,
  heroSlot
}: { 
  navigation?: Array<{ label: string; href: string }>; 
  children: React.ReactNode;
  stickyContent?: React.ReactNode;
  heroSlot?: React.ReactNode;
}) {
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
  };

  return (
    <div className="min-h-screen">
      {/* Transparent floating header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
              <img 
                src="/Seencel512_b.png" 
                alt="Seencel" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-xl text-white">Seencel</span>
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
                        className="text-sm text-white/80 transition-colors hover:text-white font-medium"
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
                      className="text-sm text-white/80 transition-colors hover:text-white font-medium"
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
                    className="md:hidden text-white hover:bg-white/10"
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
      
      <main>
        {stickyContent ? (
          // Layout with sticky sidebar for desktop
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Content - 8 columns on desktop */}
              <div className="lg:col-span-8 space-y-16">
                {heroSlot}
                {children}
              </div>
              
              {/* Sticky Sidebar - 4 columns on desktop, hidden on mobile */}
              <div className="hidden lg:block lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  {stickyContent}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Full-width layout without sticky sidebar
          <>
            {heroSlot && (
              <div className="w-full">
                {heroSlot}
              </div>
            )}
            {children}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

export function CourseLandingLayout({ 
  variant, 
  children,
  headerNavigation,
  seo,
  stickyContent,
  heroSlot
}: CourseLandingLayoutProps) {
  
  // Handle SEO meta tags with proper cleanup
  useEffect(() => {
    if (!seo) return;

    const originalTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription?.getAttribute("content") || "";
    
    // Track all meta tags with their original values and creation status
    const tagTracker = new Map<string, { tag: Element; wasCreated: boolean; originalValue: string }>();
    
    document.title = seo.title;
    
    let descriptionWasCreated = false;
    if (metaDescription) {
      metaDescription.setAttribute("content", seo.description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = seo.description;
      document.head.appendChild(meta);
      metaDescription = meta;
      descriptionWasCreated = true;
    }
    
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      const key = `property:${property}`;
      
      if (tag) {
        const originalValue = tag.getAttribute("content") || "";
        tagTracker.set(key, { tag, wasCreated: false, originalValue });
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
        tagTracker.set(key, { tag, wasCreated: true, originalValue: "" });
      }
    };

    const setMetaName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      const key = `name:${name}`;
      
      if (tag) {
        const originalValue = tag.getAttribute("content") || "";
        tagTracker.set(key, { tag, wasCreated: false, originalValue });
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
        tagTracker.set(key, { tag, wasCreated: true, originalValue: "" });
      }
    };

    setMetaTag("og:title", seo.ogTitle || seo.title);
    setMetaTag("og:description", seo.ogDescription || seo.description);
    setMetaTag("og:type", "website");
    setMetaTag("og:url", window.location.href);

    if (seo.keywords) {
      setMetaName("keywords", seo.keywords);
    }

    if (seo.ogImage) {
      setMetaTag("og:image", seo.ogImage);
    }

    if (seo.twitterImage) {
      setMetaName("twitter:image", seo.twitterImage);
    }

    return () => {
      document.title = originalTitle;
      
      if (metaDescription) {
        if (descriptionWasCreated) {
          metaDescription.remove();
        } else {
          metaDescription.setAttribute("content", originalDescription);
        }
      }
      
      tagTracker.forEach(({ tag, wasCreated, originalValue }) => {
        if (wasCreated) {
          tag.remove();
        } else {
          tag.setAttribute("content", originalValue);
        }
      });
    };
  }, [seo]);
  
  if (variant === 'public') {
    return (
      <TransparentHeaderLayout 
        navigation={headerNavigation}
        stickyContent={stickyContent}
        heroSlot={heroSlot}
      >
        {children}
      </TransparentHeaderLayout>
    );
  }
  
  // variant === 'dashboard' - Uses professional layout with sidebar
  return (
    <Layout wide>
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </Layout>
  );
}
