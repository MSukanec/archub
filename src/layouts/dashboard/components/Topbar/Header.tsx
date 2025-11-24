import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpandableAvatarGroup } from "@/components/ui-custom/ExpandableAvatarGroup";
import { ProjectSelectorButton } from "./ProjectSelectorButton";

interface Tab {
  id: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  badgeCount?: number; // Opcional: contador para mostrar en la tab
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
  icon?: React.ComponentType<any>;
  title?: string;
  description?: string;
  tabs?: Tab[];
  actions?: ActionButton[];
  className?: string;
  selector?: React.ReactNode; // Nuevo: selector de proyecto/organización
  organizationId?: string; // Nuevo: ID de la organización para mostrar miembros
  showMembers?: boolean; // Nuevo: si mostrar o no los miembros
  showProjectSelector?: boolean; // Nuevo: si mostrar el selector de proyectos
}

export function Header({ 
  icon, 
  title, 
  description, 
  tabs = [], 
  actions = [], 
  className, 
  selector,
  organizationId,
  showMembers = true,
  showProjectSelector = false
}: HeaderProps) {
  return (
    <div className={cn(
      "w-full bg-[var(--layout-bg)]",
      className
    )}>
      <div className="px-6 border-b" style={{ borderColor: 'hsl(210, 40%, 93%)' }}>
        {/* Fila Superior: Icono + Título + Descripción a la izquierda, Miembros a la derecha - SIEMPRE VISIBLE */}
        <div className="min-h-[50px] flex items-center justify-between py-2">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-center gap-3">
            {icon && (
              <span className="text-[var(--accent)] flex-shrink-0">
                {(() => {
                  const Icon = icon;
                  return <Icon className="w-6 h-6" />;
                })()}
              </span>
            )}
            <div className="flex flex-col">
              {title && (
                <h1 className="text-xl font-semibold text-[var(--foreground)]">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Expandable Avatar Group + Project Selector */}
          <div className="flex items-center gap-3">
            {showMembers && organizationId && (
              <ExpandableAvatarGroup organizationId={organizationId} />
            )}
            {showProjectSelector && (
              <ProjectSelectorButton />
            )}
          </div>
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
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span 
                      className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </span>
                  )}
                </span>
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