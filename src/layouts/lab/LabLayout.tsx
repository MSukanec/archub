import { LabProvider } from './context/LabContext';
import { LabToolbar } from './components/topbar/LabToolbar';

interface LabLayoutProps {
  children: React.ReactNode;
  showToolbar?: boolean;
  showSearch?: boolean;
  organizationId?: string;
  showMembers?: boolean;
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
            {...toolbarProps} 
          />
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </LabProvider>
  );
}

export default LabLayout;
