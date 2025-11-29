import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComparisonCategory, Plan } from "../types";

type SelectedPlan = 'free' | 'pro' | 'teams';

interface ComparisonTableProps {
  comparisonData: ComparisonCategory[];
  userPlanName?: string;
  isAuthenticated?: boolean;
  plans?: Plan[];
  billingPeriod?: 'monthly' | 'annual';
  onPlanSelect?: (plan: Plan | string) => void;
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

export function ComparisonTable({ 
  comparisonData, 
  userPlanName = '', 
  isAuthenticated = false, 
  plans = [],
  billingPeriod = 'annual',
  onPlanSelect
}: ComparisonTableProps) {
  const [, navigate] = useLocation();
  const [selectedPlanForComparison, setSelectedPlanForComparison] = useState<SelectedPlan>('pro');

  const getPlanLevel = (planName: string): number => {
    const levels: Record<string, number> = {
      'free': 1,
      'pro': 2,
      'teams': 3
    };
    return levels[planName.toLowerCase()] || 0;
  };

  const getButtonTextAndColor = (planName: string) => {
    const isTeams = planName.toLowerCase() === 'teams';
    const isCurrentPlan = planName.toLowerCase() === userPlanName?.toLowerCase();
    
    if (isTeams) {
      return { text: 'Próximamente', color: '#84cc16', disabled: true };
    }
    
    if (isCurrentPlan) {
      return { text: 'Tu plan actual', color: '#84cc16', disabled: true };
    }
    
    if (!isAuthenticated) {
      return { text: 'Comenzar', color: planName.toLowerCase() === 'pro' ? '#0047AB' : planName.toLowerCase() === 'teams' ? '#8B5CF6' : '#84cc16', disabled: false };
    }
    
    return { text: `Cambiar a ${planName}`, color: planName.toLowerCase() === 'pro' ? '#0047AB' : planName.toLowerCase() === 'teams' ? '#8B5CF6' : '#84cc16', disabled: false };
  };

  const handleTableButtonClick = (planName: string) => {
    const isTeams = planName.toLowerCase() === 'teams';
    const isCurrentPlan = planName.toLowerCase() === userPlanName?.toLowerCase();
    
    if (isTeams || isCurrentPlan) return;
    
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    const plan = plans.find(p => p.name.toLowerCase() === planName.toLowerCase());
    if (plan && onPlanSelect) {
      onPlanSelect(plan);
    }
  };

  const planNames = ['free', 'pro', 'teams'] as const;

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
              
              {planNames.map((planKey) => {
                const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);
                const { text, color, disabled } = getButtonTextAndColor(planName);
                
                return (
                  <div key={planKey} className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-[var(--text-default)] mb-2">{planName}</div>
                    <Button 
                      size="sm" 
                      style={!disabled ? { backgroundColor: color } : undefined}
                      className={cn("text-xs", !disabled && "text-white hover:opacity-90")}
                      variant={disabled ? "outline" : "default"}
                      disabled={disabled}
                      onClick={() => handleTableButtonClick(planName)}
                      data-testid={`button-table-${planKey}`}
                    >
                      {text}
                    </Button>
                  </div>
                );
              })}
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
