import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GlobalAnnouncement as AnnouncementType } from '@shared/schema';

const STORAGE_KEY = 'dismissed-announcements';
const ANNOUNCEMENT_HEIGHT = 44;

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
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Get current organization plan
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId
  );
  const planCode = (currentOrganization?.plan?.name || 'free').toLowerCase();

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing dismissed announcements:', e);
      }
    }
  }, []);

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
export function GlobalAnnouncement() {
  const { activeAnnouncement, handleDismiss } = useAnnouncementBanner();

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

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 w-full z-[100]"
        style={{
          background: 'linear-gradient(to right, #b8ad1a, #71c932)',
          height: '44px'
        }}
      >
        <div className="w-full px-4 sm:px-6 py-1.5">
          <div className="flex items-center gap-3 max-w-screen-2xl mx-auto">
            {/* Icon - Centrado verticalmente */}
            <div className="flex-shrink-0 text-white">
              {getTypeIcon(activeAnnouncement.type)}
            </div>

            {/* Content - Una sola línea */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="text-sm text-white leading-tight line-clamp-1">
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

            {/* Buttons - Inline a la derecha */}
            {(activeAnnouncement.primary_button_text || activeAnnouncement.secondary_button_text) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Secundario PRIMERO */}
                {activeAnnouncement.secondary_button_text && activeAnnouncement.secondary_button_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(normalizeUrl(activeAnnouncement.secondary_button_url!), '_blank')}
                    className="h-7 text-xs rounded-md bg-transparent hover:bg-white/10 text-white border border-white"
                  >
                    {activeAnnouncement.secondary_button_text}
                  </Button>
                )}
                {/* Primario DESPUÉS */}
                {activeAnnouncement.primary_button_text && activeAnnouncement.primary_button_url && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => window.open(normalizeUrl(activeAnnouncement.primary_button_url!), '_blank')}
                    className="h-7 text-xs rounded-md bg-white hover:bg-gray-100 text-black border border-white"
                  >
                    {activeAnnouncement.primary_button_text}
                  </Button>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => handleDismiss(activeAnnouncement.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-white"
              aria-label="Cerrar anuncio"
              data-testid="button-close-announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export height constant for layout compensation
export { ANNOUNCEMENT_HEIGHT };
