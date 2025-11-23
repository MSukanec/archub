import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NotificationDropdown } from './NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBellHeader() {
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchUnreadCount();

    const unsubscribe = subscribeUserNotifications(userId, () => {
      fetchUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  if (!userId) return null;

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón de notificaciones */}
      <button 
        ref={buttonRef}
        className="relative h-8 w-8 flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-accent text-accent-foreground border-0"
            data-testid="badge-unread-count"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Popover de notificaciones - renderizado en portal */}
      {isOpen && buttonRect && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed w-[340px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-lg overflow-hidden"
            style={{
              top: buttonRect.bottom + 8,
              right: window.innerWidth - buttonRect.right,
              zIndex: 9999
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <NotificationDropdown
              userId={userId}
              onRefresh={fetchUnreadCount}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
