import React from "react";
import { cn } from "@/lib/utils";

interface SecondaryCardProps {
  children?: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SecondaryCard: React.FC<SecondaryCardProps> = ({
  children,
  title,
  icon,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn(
        `relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg`,
        `rounded-[var(--radius-lg)] border`,
        className,
      )}
      onClick={onClick}
      style={{ 
        borderColor: 'var(--secondary-card-border)',
        backgroundColor: 'var(--secondary-card-bg)'
      }}
    >
      {/* Header Section */}
      {(title || icon) && (
        <div className="p-4 flex items-center gap-3 z-10 relative">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          {title && (
            <h3 className="font-medium" style={{ color: 'var(--secondary-card-fg)' }}>{title}</h3>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="px-4 pb-6 z-10 relative">{children}</div>

      {/* Bottom Accent Line */}
      <div
        className="absolute bottom-0 left-0 w-full h-[10px] z-0"
        style={{
          background: `linear-gradient(to right, var(--secondary-card-color-1), var(--secondary-card-color-2))`,
        }}
      />
    </div>
  );
};
