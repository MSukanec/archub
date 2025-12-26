import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Briefcase } from "lucide-react";
import { getPlanConfig } from "../data/plans-config";
export function EnterpriseCard() {
  const [, navigate] = useLocation();
  const config = getPlanConfig('enterprise');
  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border border-[var(--border-default)] overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="text-xs text-[var(--text-muted)]">
              {config.cardHeader}
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6" style={{ color: config.iconColor }} />
              <h3 className="text-2xl font-bold text-[var(--text-default)]">
                Enterprise
              </h3>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {config.description}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {config.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-[#64748b] flex-shrink-0" />
                  <span className="text-xs text-[var(--text-default)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-[var(--text-default)]">
                Precio Personalizado
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">
                Contactar a ventas
              </div>
            </div>
            <Button
              variant="secondary"
              className="px-8"
              onClick={() => navigate('/contact')}
              data-testid="button-select-plan-enterprise"
            >
              Contactar ventas
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
