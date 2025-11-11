import React from "react";
import { PageLayout } from "./PageLayout";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout es el wrapper principal
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Content area */}
      <div className="flex-1 pt-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Wrapper de PageLayout que incluye automáticamente el AppLayout
 * Para usar en lugar de PageLayout directamente
 */
interface PageWithMainHeaderProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  tabs?: any[];
  onTabChange?: (tabId: string) => void;
  showHeaderSearch?: boolean;
  headerSearchValue?: string;
  onHeaderSearchChange?: (value: string) => void;
  showHeaderFilter?: boolean;
  renderHeaderFilterContent?: () => React.ReactNode;
  isHeaderFilterActive?: boolean;
  showHeaderClearFilters?: boolean;
  onHeaderClearFilters?: () => void;
  actionButton?: any;
  actions?: React.ReactNode[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  isViewMode?: boolean;
  showCurrencySelector?: boolean;
  currencyView?: 'discriminado' | 'pesificado' | 'dolarizado';
  onCurrencyViewChange?: (view: 'discriminado' | 'pesificado' | 'dolarizado') => void;
  wide?: boolean;
  children: React.ReactNode;
}

export function PageWithMainHeader(props: PageWithMainHeaderProps) {
  return (
    <AppLayout>
      <PageLayout {...props} />
    </AppLayout>
  );
}