import { LabProvider } from './context/LabContext';
import { LabToolbar } from './components/topbar/LabToolbar';
import { Header } from './components/topbar/LabHeader';
import type { LucideIcon } from 'lucide-react';

interface LabLayoutProps {
  children: React.ReactNode;
  headerProps?: {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    organizationId?: string;
    showMembers?: boolean;
  };
  showToolbar?: boolean;
  showSearch?: boolean;
  toolbarProps?: {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    rightSlot?: React.ReactNode;
  };
}

export function LabLayout({ 
  children, 
  headerProps,
  showToolbar = true,
  showSearch = false,
  toolbarProps = {},
}: LabLayoutProps) {
  return (
    <LabProvider>
      <div className="h-full w-full flex flex-col overflow-hidden bg-background">
        {showToolbar && (
          <LabToolbar showSearch={showSearch} {...toolbarProps} />
        )}
        {headerProps && (
          <Header {...headerProps} />
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </LabProvider>
  );
}

export default LabLayout;
