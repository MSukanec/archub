import { Lock } from "lucide-react";

interface RestrictionOverlayProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  allowInteraction?: boolean;
}

export function RestrictionOverlay({
  icon = <Lock className="w-6 h-6" />,
  title,
  description,
  action,
  allowInteraction = false,
}: RestrictionOverlayProps) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-10 bg-background/80 dark:bg-background/90 backdrop-blur-sm rounded-lg ${allowInteraction ? 'pointer-events-none' : ''}`}>
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
          {icon}
        </div>
        
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        
        {description && (
          <p className="text-xs text-muted-foreground max-w-xs">
            {description}
          </p>
        )}
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
