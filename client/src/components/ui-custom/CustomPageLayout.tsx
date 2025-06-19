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
  filters?: { label: string; onClick: () => void }[];
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
  filters = [],
  onClearFilters,
  wide = false,
  children,
}: CustomPageLayoutProps) {
  return (
    <div className="flex justify-center bg-[var(--layout-bg)]">
      <div 
        className={`p-4 min-h-screen ${
          wide ? "max-w-none w-full" : "max-w-[1440px] w-full"
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
          onClearFilters={onClearFilters}
        />
        
        <CustomPageBody padding="none">
          {children}
        </CustomPageBody>
      </div>
    </div>
  );
}