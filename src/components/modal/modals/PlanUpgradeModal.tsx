import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

type PlanType = 'free' | 'pro' | 'teams' | 'enterprise';

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan: PlanType;
  featureTitle: string;
  featureDescription: string;
  featureImage: string;
  currentLimit?: number;
  currentValue?: number;
}

const planColors: Record<PlanType, string> = {
  free: 'hsl(76, 100%, 40%)',
  pro: 'hsl(213, 100%, 33%)',
  teams: 'hsl(271, 76%, 53%)',
  enterprise: 'hsl(215, 16%, 47%)',
};

const planNames: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  teams: 'Teams',
  enterprise: 'Enterprise',
};

export function PlanUpgradeModal({
  open,
  onOpenChange,
  requiredPlan,
  featureTitle,
  featureDescription,
  featureImage,
  currentLimit,
  currentValue,
}: PlanUpgradeModalProps) {
  const [, setLocation] = useLocation();
  
  const planColor = planColors[requiredPlan];
  const planName = planNames[requiredPlan];

  const handleViewPlans = () => {
    onOpenChange(false);
    setLocation('/settings/pricing-plan');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl p-0 gap-0 border-0 overflow-hidden"
        style={{ backgroundColor: 'hsl(0, 0%, 10%)' }}
      >
        <DialogTitle className="sr-only">{featureTitle}</DialogTitle>
        <DialogDescription className="sr-only">{featureDescription}</DialogDescription>
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <Badge 
            className="text-xs px-2.5 py-1 mb-3 border-0 font-medium"
            style={{ 
              backgroundColor: planColor,
              color: 'white'
            }}
          >
            Plan {planName}
          </Badge>
          <h2 className="text-xl font-semibold !text-white" aria-hidden="true">
            {featureTitle}
          </h2>
        </div>

        {/* Content - Two Columns */}
        <div className="grid grid-cols-2 gap-0">
          {/* Left Column - Image (sin padding) */}
          <div className="flex items-center justify-center bg-black/20 overflow-hidden">
            <img 
              src={featureImage} 
              alt={featureTitle}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Column - Description */}
          <div className="flex flex-col justify-center gap-4 px-6 py-6">
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(0, 0%, 44%)' }}>
              {featureDescription}
            </p>
            
            {currentLimit !== undefined && currentValue !== undefined && (
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  borderColor: 'hsl(0, 0%, 20%)',
                  backgroundColor: 'hsl(0, 0%, 8%)'
                }}
              >
                <div className="text-xs mb-1" style={{ color: 'hsl(0, 0%, 44%)' }}>
                  Límite actual
                </div>
                <div className="text-lg font-semibold !text-white">
                  {currentValue} / {currentLimit === Infinity ? '∞' : currentLimit}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'hsl(0, 0%, 20%)' }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-1/4 border"
            style={{ 
              borderColor: 'hsl(0, 0%, 30%)',
              color: 'hsl(0, 0%, 70%)'
            }}
            data-testid="button-close-plan-modal"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleViewPlans}
            className="flex-1 font-medium"
            style={{ 
              backgroundColor: 'var(--accent)',
              color: 'white'
            }}
            data-testid="button-view-plans"
          >
            Ver Planes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
