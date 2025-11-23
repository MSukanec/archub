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
        className="p-0 gap-0 overflow-hidden md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-auto md:h-auto md:min-w-0 md:max-w-6xl md:rounded-lg md:border-none md:shadow-2xl"
        style={{ backgroundColor: 'hsl(0, 0%, 10%)' }}
      >
        <DialogTitle className="sr-only">{featureTitle}</DialogTitle>
        <DialogDescription className="sr-only">{featureDescription}</DialogDescription>

        {/* Content - Two Equal Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[320px] md:min-h-[460px]">
          {/* Left Column - Image (tamaño completo) */}
          <div className="flex items-center justify-center bg-black/20 overflow-hidden md:rounded-l-lg h-full">
            <img 
              src={featureImage} 
              alt={featureTitle}
              className="w-full h-full object-cover md:rounded-l-lg"
            />
          </div>

          {/* Right Column - Badge + Título + Descripción */}
          <div className="flex flex-col justify-center gap-8 px-6 py-6">
            {/* Badge + Título */}
            <div className="flex flex-col gap-6 items-start">
              <Badge 
                className="text-xs px-2.5 py-1 border-0 font-medium"
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

            {/* Descripción */}
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(0, 0%, 50%)' }}>
              {featureDescription}
            </p>
            
            {/* Límite actual */}
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

        {/* Footer - Sin padding extra */}
        <div className="pt-2 mt-auto pb-0">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-1/4 rounded-lg border-2 bg-transparent hover:bg-white/5"
              style={{
                borderColor: planColor,
                color: planColor
              }}
              data-testid="button-close-plan-modal"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleViewPlans}
              className="w-3/4 rounded-lg"
              style={{ 
                backgroundColor: planColor,
                color: 'white'
              }}
              data-testid="button-view-plans"
            >
              Ver Planes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
