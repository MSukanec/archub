import { LucideIcon } from "lucide-react";
import { CustomPageHeader } from "./CustomPageHeader";
import { CustomPageBody } from "./CustomPageBody";

interface CustomPageLayoutProps {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[]; // Deprecated: keep for backward compatibility
  customFilters?: React.ReactNode;
  onClearFilters?: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export function CustomPageLayout({
  icon,
  title,
  actions,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [], // Deprecated: keep for backward compatibility
  customFilters,
  onClearFilters,
  wide = false,
  children,
}: CustomPageLayoutProps) {
  return (
    <div className="flex justify-center bg-[var(--layout-bg)]">
      <div 
        className={`py-6 px-4 min-h-screen mx-auto ${
          wide ? "max-w-full w-full" : "max-w-7xl w-full"
        }`}
      >
        <CustomPageHeader
          icon={icon}
          title={title}
          actions={actions}
          showSearch={showSearch}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          showFilters={showFilters}
          filters={filters}
          customFilters={customFilters}
          onClearFilters={onClearFilters}
        />
        
        <CustomPageBody padding="none">
          {children}
        </CustomPageBody>
      </div>
    </div>
  );
}