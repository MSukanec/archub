import { LabProvider } from './context/LabContext';
import { LabToolbar } from './components/topbar/LabToolbar';
import { LabDrawer } from './components/drawer/LabDrawer';
import { useLabDrawerStore } from './stores/useLabDrawerStore';
import type { PageTab } from './components/topbar/MegaMenu';

interface LabLayoutProps {
  children: React.ReactNode;
  showToolbar?: boolean;
  showSecondaryToolbar?: boolean;
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
    secondaryLeftSlot?: React.ReactNode;
    secondaryRightSlot?: React.ReactNode;
  };
  drawerContent?: React.ReactNode;
  drawerTitle?: string;
  drawerSubtitle?: string;
  drawerWidth?: 'sm' | 'md' | 'lg' | 'xl';
  isDrawerOpen?: boolean;
  onDrawerClose?: () => void;
}

function LabLayoutInner({ 
  children, 
  showToolbar = true,
  showSecondaryToolbar = true,
  showSearch = true,
  organizationId,
  showMembers = true,
  tabs = [],
  activeTab = '',
  onTabChange,
  toolbarProps = {},
  drawerContent,
  drawerTitle,
  drawerSubtitle,
  drawerWidth = 'md',
  isDrawerOpen: isDrawerOpenProp,
  onDrawerClose: onDrawerCloseProp,
}: LabLayoutProps) {
  const { drawer, closeDrawer } = useLabDrawerStore();
  
  const isDrawerOpen = isDrawerOpenProp !== undefined ? isDrawerOpenProp : drawer.isOpen;
  const handleDrawerClose = onDrawerCloseProp || closeDrawer;
  const currentDrawerContent = drawerContent || drawer.content;
  const currentDrawerTitle = drawerTitle || drawer.title;
  const currentDrawerSubtitle = drawerSubtitle || drawer.subtitle;
  const currentDrawerWidth = drawerWidth || drawer.width;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-background">
      {showToolbar && (
        <div className="flex-shrink-0 sticky top-0 z-40">
          <LabToolbar 
            showSecondaryToolbar={showSecondaryToolbar}
            showSearch={showSearch} 
            organizationId={organizationId}
            showMembers={showMembers}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            {...toolbarProps} 
          />
        </div>
      )}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="min-h-full">
            {children}
          </div>
        </div>
        <LabDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          title={currentDrawerTitle}
          subtitle={currentDrawerSubtitle}
          width={currentDrawerWidth}
        >
          {currentDrawerContent}
        </LabDrawer>
      </div>
    </div>
  );
}

export function LabLayout(props: LabLayoutProps) {
  return (
    <LabProvider>
      <LabLayoutInner {...props} />
    </LabProvider>
  );
}

export default LabLayout;
