import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFlowBlocking, FlowKey } from '@/hooks/use-flow-blocking';

interface FlowBlockedBannerProps {
  flowKey: FlowKey;
  className?: string;
}

export function FlowBlockedBanner({ flowKey, className }: FlowBlockedBannerProps) {
  const { isBlocked, message, isLoading } = useFlowBlocking(flowKey);

  if (isLoading || !isBlocked) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className} data-testid="flow-blocked-banner">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>{message.description}</AlertDescription>
    </Alert>
  );
}

interface FlowBlockedOverlayProps {
  flowKey: FlowKey;
  children: React.ReactNode;
}

export function FlowBlockedOverlay({ flowKey, children }: FlowBlockedOverlayProps) {
  const { isBlocked, message, isLoading } = useFlowBlocking(flowKey);

  if (isLoading) {
    return <>{children}</>;
  }

  if (isBlocked) {
    return (
      <div className="relative" data-testid="flow-blocked-overlay">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{message.title}</h3>
            <p className="text-muted-foreground text-sm">{message.description}</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
