import { LucideIcon } from "lucide-react";
import { CustomPageHeader } from "./CustomPageHeader";

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
    <div className="flex justify-center bg-slate-50 dark:bg-slate-900">
      <div 
        className={`px-4 border-2 border-red-500 min-h-screen ${
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
        
        <div className="border-2 border-blue-500">
          {children}
        </div>
      </div>
    </div>
  );
}