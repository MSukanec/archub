import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

type SidebarLevel = 'general' | 'organization' | 'project' | 'construction' | 'finances' | 'library' | 'provider' | 'admin' | 'community' | 'learning'

interface MiniEmptyStateProps {
  message: string;
  buttonText: string;
  onClick: () => void;
  icon?: LucideIcon;
  sidebarLevel?: SidebarLevel;
}

export function MiniEmptyState({ 
  message, 
  buttonText, 
  onClick,
  icon: Icon,
  sidebarLevel
}: MiniEmptyStateProps) {
  const { setSidebarLevel } = useNavigationStore();

  const handleClick = () => {
    if (sidebarLevel) {
      setSidebarLevel(sidebarLevel);
    }
    onClick();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 px-3 text-center bg-muted/30 dark:bg-muted/20 rounded-md border border-accent">
      {Icon && (
        <Icon className="h-5 w-5 text-accent" />
      )}
      <p className="text-xs text-muted-foreground leading-tight max-w-[240px]">
        {message}
      </p>
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleClick}
        className="mt-1 h-7 text-xs"
        data-testid="button-mini-empty-state-action"
      >
        {buttonText}
      </Button>
    </div>
  );
}
