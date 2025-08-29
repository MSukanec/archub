import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  const popoverContent = isOpen && (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-80 bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] rounded-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {items.length > 0 ? (
          items.map((item) => (
            <Button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              variant="ghost"
              className={cn(
                "w-full flex items-center justify-between text-[var(--main-sidebar-fg)] hover:bg-[var(--main-sidebar-button-hover-bg)] p-3 h-auto rounded-none first:rounded-t-md last:rounded-b-md",
                selectedId === item.id && "bg-[var(--accent)] text-white hover:bg-[var(--accent)]"
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
                <div className="flex flex-col text-left">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs opacity-70">{item.type}</span>
                </div>
              </div>
              {selectedId === item.id && (
                <div className="w-2 h-2 rounded-full ml-auto bg-white" />
              )}
            </Button>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-[var(--main-sidebar-fg)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>
      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  );
}