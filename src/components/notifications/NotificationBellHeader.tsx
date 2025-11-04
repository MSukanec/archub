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
import { Button } from '@/components/ui/button';

export function NotificationBellHeader() {
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
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 hover:bg-accent/10"
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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={8}
        className="w-80 p-0"
      >
        <NotificationDropdown
          userId={userId}
          onRefresh={fetchUnreadCount}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
