import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComparisonCategory } from "../types";

type SelectedPlan = 'free' | 'pro' | 'teams';

interface ComparisonTableProps {
  comparisonData: ComparisonCategory[];
}

function renderValue(value: boolean | string, color: string) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-accent" />
    ) : (
      <X className="h-4 w-4 text-[var(--text-muted)]" />
    );
  }
  if (value === 'Ilimitados' || value === '—') {
    return (
      <span className="text-[var(--text-muted)]">{value}</span>
    );
  }
  return <span className="text-sm text-[var(--text-default)]">{value}</span>;
}

export function ComparisonTable({ comparisonData }: ComparisonTableProps) {
  const [selectedPlanForComparison, setSelectedPlanForComparison] = useState<SelectedPlan>('pro');

  return (
    <div className="mt-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-default)]">
        Comparación Detallada
      </h2>
      
      <div className="max-w-6xl mx-auto">
        {/* Desktop: 4 columnas con sticky header */}
        <div className="hidden md:block border border-[var(--border-default)] rounded-lg">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-background border-b border-[var(--border-default)]">
            <div className="grid grid-cols-4">
              <div className="px-6 py-4">
              </div>
              
              <div className="px-6 py-4 text-center">
                <div className="text-sm font-bold text-[var(--text-default)] mb-2">Free</div>
                <Button 
                  size="sm" 
                  variant="default"
                  className="text-xs"
                  data-testid="button-table-free"
                >
                  Comenzar
                </Button>
              </div>

              <div className="px-6 py-4 text-center">
                <div className="text-sm font-bold text-[var(--text-default)] mb-2">Pro</div>
                <Button 
                  size="sm" 
                  variant="default"
                  className="text-xs"
                  data-testid="button-table-pro"
                >
                  Ser Fundador
                </Button>
              </div>

              <div className="px-6 py-4 text-center">
                <div className="text-sm font-bold text-[var(--text-default)] mb-2">Teams</div>
                <Button 
                  size="sm" 
                  variant="default"
                  className="text-xs"
                  disabled
                  data-testid="button-table-teams"
                >
                  Próximamente
                </Button>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {comparisonData.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="grid grid-cols-4 border-y border-[var(--border-default)]">
                  <div className="col-span-4 px-6 py-3">
                    <h3 className="text-sm font-semibold text-[var(--text-default)]">
                      {section.category}
                    </h3>
                  </div>
                </div>
                
                {section.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-4">
                    <div className="px-6 py-3 text-sm text-[var(--text-default)]">
                      {row.label}
                    </div>
                    <div className="px-6 py-3 flex justify-center items-center">
                      {renderValue(row.free, 'currentColor')}
                    </div>
                    <div className="px-6 py-3 flex justify-center items-center">
                      {renderValue(row.pro, 'currentColor')}
                    </div>
                    <div className="px-6 py-3 flex justify-center items-center">
                      {renderValue(row.teams, 'currentColor')}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Sticky tabs + 2 columnas */}
        <div className="md:hidden">
          <div className="sticky top-0 z-10 bg-background py-3 border-b border-[var(--border-default)]">
            <div className="flex justify-center gap-2">
              {(['free', 'pro', 'teams'] as SelectedPlan[]).map((planKey) => (
                <button
                  key={planKey}
                  onClick={() => setSelectedPlanForComparison(planKey)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
                    selectedPlanForComparison === planKey
                      ? "bg-[var(--text-default)] text-background"
                      : "text-[var(--text-muted)] border border-[var(--border-default)]"
                  )}
                  data-testid={`tab-comparison-${planKey}`}
                >
                  {planKey}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {comparisonData.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="px-4 py-3 border-y border-[var(--border-default)]">
                  <h3 className="text-sm font-semibold text-[var(--text-default)]">
                    {section.category}
                  </h3>
                </div>
                
                {section.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-2">
                    <div className="px-4 py-3 text-sm text-[var(--text-default)]">
                      {row.label}
                    </div>
                    <div className="px-4 py-3 flex justify-center items-center">
                      {renderValue(row[selectedPlanForComparison], 'currentColor')}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
