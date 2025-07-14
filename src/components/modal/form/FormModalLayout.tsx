import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormModalLayoutProps {
  leftPanel?: ReactNode;
  centerPanel?: ReactNode;
  rightPanel?: ReactNode;
  onClose: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
}

export function FormModalLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  onClose,
  showHeader = true,
  showFooter = true,
  headerContent,
  footerContent,
  className,
}: FormModalLayoutProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        className={cn(
          "bg-background border border-border rounded-lg shadow-xl",
          "w-full h-full max-w-screen-2xl max-h-screen",
          "md:w-auto md:h-auto md:max-w-screen-2xl md:max-h-[90vh]",
          "flex flex-col",
          className
        )}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex-1">
              {headerContent}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          {leftPanel && (
            <div className="w-full md:w-1/3 md:max-w-md border-r border-border overflow-y-auto">
              <div className="p-4">
                {leftPanel}
              </div>
            </div>
          )}

          {/* Center Panel */}
          {centerPanel && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {centerPanel}
              </div>
            </div>
          )}

          {/* Right Panel */}
          {rightPanel && (
            <div className="w-full md:w-1/3 md:max-w-md border-l border-border overflow-y-auto">
              <div className="p-4">
                {rightPanel}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showFooter && footerContent && (
          <div className="p-4 border-t border-border">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}