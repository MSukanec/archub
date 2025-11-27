import { LabProvider } from '../context/LabContext';
import { LabToolbar } from './topbar/LabToolbar';

interface LabPageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showToolbar?: boolean;
  toolbarProps?: {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    rightSlot?: React.ReactNode;
    showOrgProjectSelectors?: boolean;
  };
}

/**
 * LabPageLayout - Layout para páginas experimentales del Lab
 * 
 * Estructura:
 * - Header (LabToolbar): Search 50% + controles dinámicos
 * - Content: Área principal fullwidth
 * 
 * Se usa DENTRO de DashboardLayout con hideHeader={true}.
 * 
 * Uso:
 * ```tsx
 * <DashboardLayout hideHeader wide>
 *   <LabPageLayout>
 *     {contenido del lab}
 *   </LabPageLayout>
 * </DashboardLayout>
 * ```
 */
export function LabPageLayout({ 
  children, 
  className = '',
  showToolbar = true,
  toolbarProps = {},
}: LabPageLayoutProps) {
  return (
    <LabProvider>
      <div className={`h-full w-full flex flex-col overflow-hidden ${className}`}>
        {showToolbar && (
          <LabToolbar {...toolbarProps} />
        )}
        <div className="flex-1 overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </LabProvider>
  );
}

export default LabPageLayout;
