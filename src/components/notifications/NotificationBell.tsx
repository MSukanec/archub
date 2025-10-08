import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from './NotificationDropdown';
import ButtonSidebar from '@/components/layout/desktop/ButtonSidebar';

interface NotificationBellProps {
  isExpanded: boolean;
}

export function NotificationBell({ isExpanded }: NotificationBellProps) {
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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

  if (!userId) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <ButtonSidebar
            icon={<Bell className="w-[18px] h-[18px]" />}
            label="Notificaciones"
            isActive={false}
            isExpanded={isExpanded}
            onClick={() => setIsOpen(!isOpen)}
            variant="secondary"
            rightIcon={
              unreadCount > 0 ? (
                <Badge
                  className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center bg-[var(--accent)] text-white border-0 hover:bg-[var(--accent)]"
                  data-testid="badge-unread-count"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              ) : undefined
            }
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationDropdown
          userId={userId}
          onRefresh={fetchUnreadCount}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
