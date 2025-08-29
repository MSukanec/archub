import { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cerrar con escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const popoverContent = isOpen && (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center"
      onClick={() => setIsOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      }}
      tabIndex={-1}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div 
        className="w-80 bg-[var(--main-sidebar-bg)] border border-[var(--main-sidebar-border)] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {items.length > 0 ? (
          items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                "w-full flex items-center justify-between text-[var(--main-sidebar-fg)] hover:bg-[var(--main-sidebar-button-hover-bg)] focus:bg-[var(--main-sidebar-button-hover-bg)] p-3 transition-colors duration-150 border-0 bg-transparent cursor-pointer text-left",
                selectedId === item.id && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] focus:bg-[var(--accent)]",
                index > 0 && "border-t border-[var(--main-sidebar-border)] border-opacity-20"
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
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: (item as any).color || 'hsl(var(--accent))' }}
                  >
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
            </button>
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