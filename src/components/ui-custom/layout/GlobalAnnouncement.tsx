import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GlobalAnnouncement as AnnouncementType } from '@shared/schema';

const STORAGE_KEY = 'dismissed-announcements';

export function GlobalAnnouncement() {
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

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'info':
        return 'from-blue-500/10 via-blue-400/5 to-transparent dark:from-blue-600/20 dark:via-blue-500/10';
      case 'warning':
        return 'from-yellow-500/10 via-yellow-400/5 to-transparent dark:from-yellow-600/20 dark:via-yellow-500/10';
      case 'error':
        return 'from-red-500/10 via-red-400/5 to-transparent dark:from-red-600/20 dark:via-red-500/10';
      case 'success':
        return 'from-green-500/10 via-green-400/5 to-transparent dark:from-green-600/20 dark:via-green-500/10';
      default:
        return 'from-blue-500/10 via-blue-400/5 to-transparent dark:from-blue-600/20 dark:via-blue-500/10';
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'info':
        return {
          text: 'text-blue-700 dark:text-blue-300',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'warning':
        return {
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'error':
        return {
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800'
        };
      case 'success':
        return {
          text: 'text-green-700 dark:text-green-300',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800'
        };
      default:
        return {
          text: 'text-blue-700 dark:text-blue-300',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800'
        };
    }
  };

  const convertSmartLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+|wa\.me\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 transition-opacity font-medium"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!activeAnnouncement) return null;

  const colors = getTypeColors(activeAnnouncement.type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative overflow-hidden border-b',
          colors.border
        )}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-r', getTypeGradient(activeAnnouncement.type))} />
        
        <div className="relative container mx-auto px-4 py-3">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Icon */}
            <div className={cn('flex-shrink-0 mt-0.5', colors.icon)}>
              {getTypeIcon(activeAnnouncement.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1.5">
                {/* Title */}
                {activeAnnouncement.title && (
                  <h3 className={cn('text-sm font-semibold', colors.text)}>
                    {activeAnnouncement.title}
                  </h3>
                )}

                {/* Message */}
                <p className={cn('text-sm leading-relaxed', colors.text)}>
                  {convertSmartLinks(activeAnnouncement.message)}
                  {activeAnnouncement.link_text && activeAnnouncement.link_url && (
                    <>
                      {' '}
                      <a
                        href={activeAnnouncement.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80 transition-opacity font-medium"
                      >
                        {activeAnnouncement.link_text}
                      </a>
                    </>
                  )}
                </p>

                {/* Buttons */}
                {(activeAnnouncement.primary_button_text || activeAnnouncement.secondary_button_text) && (
                  <div className="flex items-center gap-2 mt-1">
                    {activeAnnouncement.primary_button_text && activeAnnouncement.primary_button_url && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => window.open(activeAnnouncement.primary_button_url!, '_blank')}
                        className="h-7 text-xs"
                      >
                        {activeAnnouncement.primary_button_text}
                      </Button>
                    )}
                    {activeAnnouncement.secondary_button_text && activeAnnouncement.secondary_button_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(activeAnnouncement.secondary_button_url!, '_blank')}
                        className="h-7 text-xs"
                      >
                        {activeAnnouncement.secondary_button_text}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => handleDismiss(activeAnnouncement.id)}
              className={cn(
                'flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                colors.text
              )}
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
