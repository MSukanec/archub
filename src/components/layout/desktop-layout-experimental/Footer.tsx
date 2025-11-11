import { useEffect, useState, RefObject } from "react";
import { Link } from "wouter";

interface FooterProps {
  scrollContainerRef?: RefObject<HTMLElement>;
}

export function Footer({ scrollContainerRef }: FooterProps) {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef?.current) {
        setShowFooter(scrollContainerRef.current.scrollTop > 100);
      } else {
        setShowFooter(window.scrollY > 100);
      }
    };

    const scrollElement = scrollContainerRef?.current || window;
    
    scrollElement.addEventListener("scroll", handleScroll as any);
    return () => scrollElement.removeEventListener("scroll", handleScroll as any);
  }, [scrollContainerRef]);

  if (!showFooter) return null;

  return (
    <footer className="border-t py-6 mt-auto transition-opacity duration-300">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="/Seencel512_b.png" 
              alt="Seencel" 
              className="h-6 w-6 object-contain"
            />
            <span className="font-semibold">Seencel</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link 
              href="/" 
              className="hover:text-foreground transition-colors"
              data-testid="link-footer-home"
            >
              Inicio
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
              data-testid="link-footer-privacy"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
