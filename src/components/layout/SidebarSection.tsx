import { SidebarButton } from "./SidebarButton";
import { SidebarItem } from "@/data/sidebarItems";

interface SidebarSectionProps {
  items: SidebarItem[]
  isExpanded: boolean
  className?: string
}

export function SidebarSection({ items, isExpanded, className }: SidebarSectionProps) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.href} className="mb-1">
          <SidebarButton
            icon={item.icon}
            label={item.label}
            href={item.href}
            isExpanded={isExpanded}
          />
        </div>
      ))}
    </div>
  );
}