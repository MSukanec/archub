import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GlobalAnnouncement as AnnouncementType } from '@shared/schema';

const STORAGE_KEY = 'dismissed-announcements';
const ANNOUNCEMENT_HEIGHT = 44; // Desktop height
const ANNOUNCEMENT_HEIGHT_MOBILE = 80; // Approximate mobile height (text + buttons stacked)

// Context type
interface AnnouncementContextType {
  hasActiveAnnouncement: boolean;
  activeAnnouncement: AnnouncementType | null;
  handleDismiss: (id: string) => void;
}

// Context to share announcement state
const AnnouncementContext = createContext<AnnouncementContextType>({ 
  hasActiveAnnouncement: false,
  activeAnnouncement: null,
  handleDismiss: () => {},
});

export const useAnnouncementBanner = () => useContext(AnnouncementContext);

// Provider component that manages ALL announcement logic
export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const { data: userData } = useCurrentUser();
  
  // Initialize dismissedIds synchronously from localStorage to prevent layout jumps
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error parsing dismissed announcements:', e);
      return [];
    }
  });

  // Get current organization plan
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId
  );
  const planCode = (currentOrganization?.plan?.name || 'free').toLowerCase();

  // Fetch active announcements
  const { data: announcements } = useQuery({
    queryKey: ['global-announcements'],
    queryFn: async () => {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('global_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        return [];
      }

      return data as AnnouncementType[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter announcements by audience and date range
  const activeAnnouncement = announcements?.find((announcement) => {
    // Check if dismissed
    if (dismissedIds.includes(announcement.id)) return false;

    // Check audience
    if (announcement.audience && announcement.audience !== 'all') {
      if (announcement.audience !== planCode) return false;
    }

    // Check date range
    const now = new Date();
    
    if (announcement.starts_at) {
      const startsAt = new Date(announcement.starts_at);
      if (now < startsAt) return false;
    }

    if (announcement.ends_at) {
      const endsAt = new Date(announcement.ends_at);
      if (now > endsAt) return false;
    }

    return true;
  });

  const handleDismiss = (id: string) => {
    const newDismissedIds = [...dismissedIds, id];
    setDismissedIds(newDismissedIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissedIds));
  };

  const hasActiveAnnouncement = !!activeAnnouncement;

  return (
    <AnnouncementContext.Provider value={{ 
      hasActiveAnnouncement, 
      activeAnnouncement: activeAnnouncement || null,
      handleDismiss 
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
}

// Banner component that ONLY renders (reads from context)
export function GlobalAnnouncementBanner() {
  const { activeAnnouncement, handleDismiss } = useAnnouncementBanner();
  const [, navigate] = useLocation();

  // Check if URL is internal (starts with / and not //)
  const isInternalUrl = (url: string): boolean => {
    const normalized = url.trim();
    return normalized.startsWith('/') && !normalized.startsWith('//');
  };

  // Handle button click - navigate internally or open external
  const handleButtonClick = (url: string) => {
    const normalizedUrl = normalizeUrl(url);
    if (isInternalUrl(url)) {
      navigate(url);
    } else {
      window.open(normalizedUrl, '_blank');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Normalize URL: add https:// if needed, but preserve mailto: and wa.me links
  const normalizeUrl = (url: string): string => {
    if (!url) return url;
    
    const trimmedUrl = url.trim();
    
    // If it's already a valid protocol, return as-is
    if (
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('mailto:') ||
      trimmedUrl.startsWith('tel:')
    ) {
      return trimmedUrl;
    }
    
    // If it's a wa.me link without protocol, add https://
    if (trimmedUrl.startsWith('wa.me/')) {
      return `https://${trimmedUrl}`;
    }
    
    // For any other URL, add https://
    return `https://${trimmedUrl}`;
  };

  if (!activeAnnouncement) return null;

  const hasButtons = activeAnnouncement.primary_button_text || activeAnnouncement.secondary_button_text;

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 w-full z-[100]"
        style={{
          background: 'linear-gradient(to right, #71c932, #b8ad1a)',
        }}
      >
        {/* Container con padding responsive */}
        <div className="relative w-full px-4 py-2 md:py-1.5 md:px-6 lg:px-[min(100px,5vw)]">
          
          {/* Close button - Posición absoluta en esquina superior derecha */}
          <button
            onClick={() => handleDismiss(activeAnnouncement.id)}
            className="absolute top-2 right-3 p-1 rounded-md hover:bg-white/10 transition-colors text-white z-10"
            aria-label="Cerrar anuncio"
            data-testid="button-close-announcement"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Layout: Columna en mobile, fila en desktop */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 pr-8 md:pr-6">
            
            {/* Fila superior mobile / Izquierda desktop: Icono + Texto */}
            <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0 text-white mt-0.5 md:mt-0">
                {getTypeIcon(activeAnnouncement.type)}
              </div>

              {/* Content - Texto completo en mobile, una línea en desktop */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug md:leading-tight md:line-clamp-1">
                  {activeAnnouncement.title && (
                    <span className="font-semibold">
                      {activeAnnouncement.title}
                    </span>
                  )}
                  {activeAnnouncement.title && ' '}
                  <span className="text-gray-100">
                    {activeAnnouncement.message}
                  </span>
                  {activeAnnouncement.link_text && activeAnnouncement.link_url && (
                    <>
                      {' '}
                      <a
                        href={normalizeUrl(activeAnnouncement.link_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80 transition-opacity font-medium"
                      >
                        {activeAnnouncement.link_text}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Botones - Debajo del texto en mobile, a la derecha en desktop */}
            {hasButtons && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-7 md:ml-0">
                {/* Secundario PRIMERO (izquierda) - borde y texto blanco */}
                {activeAnnouncement.secondary_button_text && activeAnnouncement.secondary_button_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleButtonClick(activeAnnouncement.secondary_button_url!)}
                    className="h-7 md:h-8 px-3 md:px-4 text-xs font-medium rounded-lg bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
                  >
                    {activeAnnouncement.secondary_button_text}
                  </Button>
                )}
                {/* Primario DESPUÉS (derecha) - estilo default del tema */}
                {activeAnnouncement.primary_button_text && activeAnnouncement.primary_button_url && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleButtonClick(activeAnnouncement.primary_button_url!)}
                    className="h-7 md:h-8 px-3 md:px-4 text-xs font-medium"
                  >
                    {activeAnnouncement.primary_button_text}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export height constants for layout compensation
export { ANNOUNCEMENT_HEIGHT, ANNOUNCEMENT_HEIGHT_MOBILE };
