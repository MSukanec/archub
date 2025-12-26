import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DrawerBodyProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DrawerBody({
  children,
  className,
  noPadding = false,
}: DrawerBodyProps) {
  return (
    <div 
      className={cn(
        'w-full',
        !noPadding && 'px-6 py-4',
        className
      )}
      data-testid="drawer-body"
    >
      {children}
    </div>
  );
}

export default DrawerBody;
