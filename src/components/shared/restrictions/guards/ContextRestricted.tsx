import { EmptyStateBlock } from "../ui/EmptyStateBlock";
import { AlertCircle } from "lucide-react";

interface ContextRestrictedProps {
  isBlocked: boolean;
  blockTitle: string;
  blockDescription?: string;
  action?: React.ReactNode;
  useOverlay?: boolean;
  children: React.ReactNode;
}

export function ContextRestricted({
  isBlocked,
  blockTitle,
  blockDescription,
  action,
  useOverlay = false,
  children,
}: ContextRestrictedProps) {
  if (!isBlocked) {
    return <>{children}</>;
  }

  if (useOverlay) {
    return (
      <div className="relative w-full">
        <div className="relative w-full opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 dark:bg-background/90 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {blockTitle}
            </h3>
            {blockDescription && (
              <p className="text-xs text-muted-foreground max-w-xs">
                {blockDescription}
              </p>
            )}
            {action && <div className="mt-2">{action}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Default: EmptyStateBlock
  return (
    <EmptyStateBlock
      icon={<AlertCircle className="w-6 h-6 text-red-500" />}
      title={blockTitle}
      description={blockDescription}
      action={action}
    />
  );
}

export default ContextRestricted;
