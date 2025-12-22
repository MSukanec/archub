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
  toolbarProps?: {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    rightSlot?: React.ReactNode;
    showOrgProjectSelectors?: boolean;
  };
}

export function LabLayout({ 
  children, 
  headerProps,
  showToolbar = true,
  toolbarProps = {},
}: LabLayoutProps) {
  return (
    <LabProvider>
      <div className="h-full w-full flex flex-col overflow-hidden bg-background">
        {showToolbar && (
          <LabToolbar {...toolbarProps} />
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
