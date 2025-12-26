import { cn } from "@/lib/utils";
import type { BillingPeriod } from "../types";
interface BillingToggleProps {
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
}
export function BillingToggle({ billingPeriod, onBillingPeriodChange }: BillingToggleProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center bg-card rounded-xl p-1.5 shadow-sm border border-[var(--border-default)]">
        <button
          onClick={() => onBillingPeriodChange('monthly')}
          className={cn(
            "px-8 py-2.5 rounded-lg font-medium transition-all text-sm",
            billingPeriod === 'monthly'
              ? "bg-accent text-accent-foreground shadow-md"
              : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
          )}
          data-testid="button-billing-monthly"
        >
          Mensual
        </button>
        <button
          onClick={() => onBillingPeriodChange('annual')}
          className={cn(
            "px-8 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2.5",
            billingPeriod === 'annual'
              ? "bg-accent text-accent-foreground shadow-md"
              : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
          )}
          data-testid="button-billing-annual"
        >
          <span>Anual</span>
          <span className="text-xs font-bold bg-accent-foreground/20 px-2 py-0.5 rounded">
            -20%
          </span>
        </button>
      </div>
    </div>
  );
}
