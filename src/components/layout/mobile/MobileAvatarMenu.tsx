import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLocation } from "wouter";

interface MobileAvatarMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileAvatarMenu({ onClose }: MobileAvatarMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();

  // Function to check if a button is active based on current location
  const isButtonActive = (href: string) => {
    if (!href || href === '#') return false;
    // Special case for organization dashboard - should be active when on /dashboard or /organization/dashboard
    if (href === '/organization/dashboard') {
      return location === '/organization/dashboard' || location === '/dashboard';
    }
    return location === href || location.startsWith(href + '/');
  };

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);



  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9998 }} onClick={onClose}>
      <div 
        className="fixed bottom-0 left-0 right-0 rounded-t-xl p-1 space-y-3" 
        style={{ backgroundColor: 'var(--menues-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >


        {/* User Profile Button - Full width */}
        <div className="pt-2">
          <button
            onClick={() => handleNavigation('/profile')}
            className="w-full flex items-center gap-3 px-2 py-3 rounded-xl transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
            style={{ 
              color: isButtonActive('/profile') ? 'white' : 'var(--menues-fg)',
              backgroundColor: isButtonActive('/profile') ? 'var(--accent)' : 'transparent',
              border: '1px solid var(--menues-border)'
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData?.user?.avatar_url || ''} />
              <AvatarFallback style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                {userData?.user?.full_name?.charAt(0) || userData?.user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="font-medium text-base" style={{ color: 'var(--menues-fg)' }}>
                {userData?.user?.full_name || 'Usuario'}
              </div>
              <div className="text-sm opacity-70" style={{ color: 'var(--menues-fg)' }}>
                Mi Perfil
              </div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}