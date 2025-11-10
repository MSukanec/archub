import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface MiniEmptyStateProps {
  message: string;
  buttonText: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export function MiniEmptyState({ 
  message, 
  buttonText, 
  onClick,
  icon: Icon 
}: MiniEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 px-3 text-center bg-muted/30 dark:bg-muted/20 rounded-md border border-border/50">
      {Icon && (
        <Icon className="h-5 w-5 text-muted-foreground/60" />
      )}
      <p className="text-xs text-muted-foreground leading-tight max-w-[240px]">
        {message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className="mt-1 h-7 text-xs"
        data-testid="button-mini-empty-state-action"
      >
        {buttonText}
      </Button>
    </div>
  );
}
