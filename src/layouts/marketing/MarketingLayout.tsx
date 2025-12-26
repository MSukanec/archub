import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { GlobalAnnouncement, AnnouncementProvider, useAnnouncementBanner, ANNOUNCEMENT_HEIGHT, ANNOUNCEMENT_HEIGHT_MOBILE } from "@/features/users/components/GlobalAnnouncement";
import { useMobile } from "@/hooks/use-mobile";

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  ogImage?: string;
  twitterImage?: string;
}

interface MarketingLayoutProps {
  children: React.ReactNode;
  headerNavigation?: Array<{ label: string; href: string }>;
  seo?: SEOProps;
  heroSlot?: React.ReactNode;
  stickyContent?: React.ReactNode;
}

export function MarketingLayout({ 
  children, 
  headerNavigation,
  seo,
  heroSlot,
  stickyContent
}: MarketingLayoutProps) {
  return (
    <AnnouncementProvider>
      <MarketingLayoutContent
        headerNavigation={headerNavigation}
        seo={seo}
        heroSlot={heroSlot}
        stickyContent={stickyContent}
      >
        {children}
      </MarketingLayoutContent>
    </AnnouncementProvider>
  );
}

function MarketingLayoutContent({ 
  children, 
  headerNavigation,
  seo,
  heroSlot,
  stickyContent
}: MarketingLayoutProps) {
  const [location] = useLocation();
  const { hasActiveAnnouncement } = useAnnouncementBanner();
  const isMobile = useMobile();
  const announcementHeight = isMobile ? ANNOUNCEMENT_HEIGHT_MOBILE : ANNOUNCEMENT_HEIGHT;

  // Handle hash scrolling after SPA navigation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  // Handle SEO meta tags with proper cleanup
  useEffect(() => {
    if (!seo) return;

    const originalTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription?.getAttribute("content") || "";
    
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

  const HEADER_HEIGHT = 64; // h-16 = 64px
  const bannerOffset = hasActiveAnnouncement ? announcementHeight : 0;
  const totalOffset = bannerOffset + HEADER_HEIGHT;

  // Special layout with hero section (for course landing pages)
  // Hero goes BEHIND the translucent header, no padding on wrapper
  if (heroSlot) {
    return (
      <>
        <GlobalAnnouncement />
        <div className="min-h-screen overflow-x-hidden">
          <Header navigation={headerNavigation} hasAnnouncement={hasActiveAnnouncement} announcementHeight={announcementHeight} />
          
          {/* Floating Sticky Card - Desktop only, positioned absolutely */}
          {stickyContent && (
            <div 
              className="hidden lg:block fixed z-40"
              style={{
                top: `${totalOffset + 32}px`,
                width: '368px',
                right: 'max(32px, calc((100vw - 1472px) / 2))',
              }}
            >
              <div className="sticky top-24">
                {stickyContent}
              </div>
            </div>
          )}
          
          {/* Hero section - uses negative margin to go behind the fixed header+announcement */}
          <div style={{ marginTop: `-${totalOffset}px`, paddingTop: `${bannerOffset}px` }}>
            {heroSlot}
          </div>
          
          <main className="overflow-x-hidden">
            {children}
          </main>
          
          <Footer />
        </div>
      </>
    );
  }

  // Normal layout (for standard marketing pages)
  return (
    <>
      <GlobalAnnouncement />
      <div 
        className="min-h-screen bg-background flex flex-col overflow-x-hidden"
        style={{ paddingTop: `${totalOffset}px` }}
      >
        <Header navigation={headerNavigation} hasAnnouncement={hasActiveAnnouncement} announcementHeight={announcementHeight} />
        <div className="container mx-auto px-6 py-12 flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}
