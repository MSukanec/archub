import { useEffect } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  ogImage?: string;
  twitterImage?: string;
}

interface PublicLayoutProps {
  children: React.ReactNode;
  headerNavigation?: Array<{ label: string; href: string }>;
  seo?: SEOProps;
}

export function PublicLayout({ 
  children, 
  headerNavigation,
  seo 
}: PublicLayoutProps) {
  useEffect(() => {
    if (!seo) return;

    const originalTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription?.getAttribute("content") || "";
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const originalOgTitle = ogTitle?.getAttribute("content") || "";
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const originalOgDescription = ogDescription?.getAttribute("content") || "";
    
    const ogType = document.querySelector('meta[property="og:type"]');
    const originalOgType = ogType?.getAttribute("content") || "";
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const originalOgUrl = ogUrl?.getAttribute("content") || "";

    const createdTags: Element[] = [];
    
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
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
        createdTags.push(tag);
      }
    };

    const setMetaName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
        createdTags.push(tag);
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
      
      if (ogTitle) {
        ogTitle.setAttribute("content", originalOgTitle);
      }
      
      if (ogDescription) {
        ogDescription.setAttribute("content", originalOgDescription);
      }
      
      if (ogType) {
        ogType.setAttribute("content", originalOgType);
      }
      
      if (ogUrl) {
        ogUrl.setAttribute("content", originalOgUrl);
      }
      
      createdTags.forEach(tag => tag.remove());
    };
  }, [seo]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader navigation={headerNavigation} />
      <div className="container mx-auto px-6 py-12 flex-1">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
