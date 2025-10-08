import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
import { useAuthStore } from '@/stores/authStore';
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
  const user = useAuthStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

    const unsubscribe = subscribeUserNotifications(user.id, () => {
      fetchUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  if (!user?.id) return null;

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
                  variant="destructive"
                  className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
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
          userId={user.id}
          onRefresh={fetchUnreadCount}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
