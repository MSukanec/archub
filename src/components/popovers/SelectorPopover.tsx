import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface SelectorItem {
  id: string;
  name: string;
  logo_url?: string | null;
  type: string; // "Proyecto" | "Organización"
}

interface SelectorPopoverProps {
  trigger: ReactNode;
  items: SelectorItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  emptyMessage: string;
  getInitials: (name: string) => string;
}

export function SelectorPopover({
  trigger,
  items,
  selectedId,
  onSelect,
  emptyMessage,
  getInitials
}: SelectorPopoverProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)]"
        style={{
          position: 'fixed',
          left: '50vw',
          top: '50vh',
          transform: 'translate(-50%, -50%)',
          zIndex: 50
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={0}
        alignOffset={0}
        avoidCollisions={false}
        side="bottom"
        align="center"
      >
        {items.length > 0 ? (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex items-center justify-between text-[var(--main-sidebar-fg)] hover:bg-[var(--main-sidebar-button-hover-bg)] focus:bg-[var(--main-sidebar-button-hover-bg)] p-3 cursor-pointer",
                selectedId === item.id && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] focus:bg-[var(--accent)]"
              )}
            >
              <div className="flex items-center gap-3">
                {item.logo_url ? (
                  <img 
                    src={item.logo_url} 
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                    {getInitials(item.name)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs opacity-70">{item.type}</span>
                </div>
              </div>
              {selectedId === item.id && (
                <div className="w-2 h-2 rounded-full ml-auto bg-white" />
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-[var(--main-sidebar-fg)]">
            {emptyMessage}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}