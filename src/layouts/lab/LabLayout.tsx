import { LabProvider } from './context/LabContext';
import { LabToolbar } from './components/topbar/LabToolbar';
import type { PageTab } from './components/topbar/MegaMenu';

interface LabLayoutProps {
  children: React.ReactNode;
  showToolbar?: boolean;
  showSearch?: boolean;
  organizationId?: string;
  showMembers?: boolean;
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  toolbarProps?: {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    rightSlot?: React.ReactNode;
  };
}

export function LabLayout({ 
  children, 
  showToolbar = true,
  showSearch = false,
  organizationId,
  showMembers = true,
  tabs = [],
  activeTab = '',
  onTabChange,
  toolbarProps = {},
}: LabLayoutProps) {
  return (
    <LabProvider>
      <div className="h-full w-full flex flex-col overflow-hidden bg-background">
        {showToolbar && (
          <LabToolbar 
            showSearch={showSearch} 
            organizationId={organizationId}
            showMembers={showMembers}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            {...toolbarProps} 
          />
        )}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          <div className="min-h-full">
            {children}
          </div>
        </div>
      </div>
    </LabProvider>
  );
}

export default LabLayout;
