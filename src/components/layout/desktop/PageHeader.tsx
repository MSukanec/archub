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

interface HeaderProps {
  title?: string;
  tabs?: Tab[];
  actions?: ActionButton[];
  className?: string;
  selector?: React.ReactNode; // Nuevo: selector de proyecto/organización
}

export function Header({ title, tabs = [], actions = [], className, selector }: HeaderProps) {
  return (
    <div className={cn(
      "w-full bg-[var(--layout-bg)]",
      className
    )}>
      <div className="px-6 border-b" style={{ borderColor: 'hsl(210, 40%, 93%)' }}>
        {/* Fila Superior: Título a la izquierda, Selector a la derecha */}
      <div className="h-12 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center">
          {title && (
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Selector (Project/Organization) */}
        {selector && (
          <div className="flex items-center gap-2">
            {selector}
          </div>
        )}
        </div>

        {/* Fila Inferior: Tabs a la izquierda, Acciones a la derecha */}
        {(tabs.length > 0 || actions.length > 0) && (
          <div className="flex items-center justify-between border-t" style={{ borderColor: 'hsl(210, 40%, 93%)' }}>
          {/* Left: Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={cn(
                  "relative py-5 px-3 text-sm font-medium transition-all duration-200 border-b-2",
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
          {actions.length > 0 && (
            <div className="flex items-center gap-2 py-2">
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
          )}
          </div>
        )}
      </div>
    </div>
  );
}