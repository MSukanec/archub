import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}

interface ActionButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
}

interface PageHeaderProps {
  tabs?: Tab[];
  actions?: ActionButton[];
  className?: string;
}

export function PageHeader({ tabs = [], actions = [], className }: PageHeaderProps) {
  return (
    <div className={cn(
      "w-full h-12 bg-[var(--layout-bg)] border-b border-[var(--menues-border)] flex items-center justify-between px-4",
      className
    )}>
      {/* Left: Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={cn(
              "relative h-12 px-3 text-sm font-medium transition-all duration-200 border-b-2",
              tab.isActive
                ? "text-[var(--accent)] border-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            onClick={action.onClick}
            variant={action.variant || "default"}
            size="sm"
            disabled={action.disabled}
            className="h-8"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}