import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLab } from '../../context/LabContext';

interface LabToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
  showOrgProjectSelectors?: boolean;
}

export function LabToolbar({
  searchPlaceholder = "Search influencer, organization or metric...",
  searchValue = "",
  onSearchChange,
  rightSlot,
  showOrgProjectSelectors = true,
}: LabToolbarProps) {
  const {
    selectedOrgId,
    setSelectedOrgId,
    selectedProjectId,
    setSelectedProjectId,
    organizations,
    projects,
  } = useLab();

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="h-14 w-full flex bg-[var(--header-bg)] border-b border-[var(--header-border)]">
      <div className="flex-1 flex items-center border-r border-[var(--header-border)]">
        <div className="flex items-center gap-3 px-4 w-full">
          <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--text-subtle)] text-sm outline-none"
            data-testid="input-lab-search"
          />
        </div>
      </div>
      
      {showOrgProjectSelectors && (
        <>
          <div className="w-48 flex flex-col justify-center px-4 border-r border-[var(--header-border)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer">
            <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
              <SelectTrigger 
                className="h-full w-full border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden"
                data-testid="select-lab-organization"
              >
                <div className="flex flex-col items-start text-left w-full">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-medium">
                    Organization
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)] truncate w-full">
                    {selectedOrg?.name || 'Select...'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48 flex flex-col justify-center px-4 border-r border-[var(--header-border)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer">
            <Select 
              value={selectedProjectId || ''} 
              onValueChange={setSelectedProjectId}
              disabled={!selectedOrgId || projects.length === 0}
            >
              <SelectTrigger 
                className="h-full w-full border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden disabled:opacity-50"
                data-testid="select-lab-project"
              >
                <div className="flex flex-col items-start text-left w-full">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-medium">
                    Project
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)] truncate w-full">
                    {selectedProject?.name || 'Select...'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {rightSlot && (
        <div className="flex items-center px-4">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
