import { Lock } from "lucide-react";

interface EmptyStateBlockProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyStateBlock({
  icon = <Lock className="w-6 h-6" />,
  title,
  description,
  action,
}: EmptyStateBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center border border-dashed border-border rounded-lg bg-background/50">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-muted-foreground">
        {icon}
      </div>
      
      <div className="space-y-1 max-w-xs">
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      
      {action && (
        <div className="mt-3">
          {action}
        </div>
      )}
    </div>
  );
}
