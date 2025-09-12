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
  title?: string;
  tabs?: Tab[];
  actions?: ActionButton[];
  className?: string;
}

export function PageHeader({ title, tabs = [], actions = [], className }: PageHeaderProps) {
  return (
    <div className={cn(
      "w-full bg-[var(--layout-bg)]",
      className
    )}>
      <div className="px-6 border-b border-[var(--main-sidebar-border)]">
        {/* Fila Superior: Título a la izquierda, Acciones a la derecha */}
      <div className="h-12 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center">
          {title && (
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h1>
          )}
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

        {/* Fila Inferior: Tabs a la izquierda */}
        {tabs.length > 0 && (
          <div className="h-12 flex items-center">
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
          </div>
        )}
      </div>
    </div>
  );
}