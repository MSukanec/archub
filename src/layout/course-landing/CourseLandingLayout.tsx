import { useEffect } from "react";
import { PublicHeader } from "@/layout/public/PublicHeader";
import { PublicFooter } from "@/layout/public/PublicFooter";
import { Layout } from "@/layout/desktop/Layout";

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
}

export function CourseLandingLayout({ 
  variant, 
  children,
  headerNavigation,
  seo
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
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader navigation={headerNavigation} />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
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
