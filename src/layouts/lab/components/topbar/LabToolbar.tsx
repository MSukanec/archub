import { Search, Building2, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="h-14 w-full bg-[#0d0d12] border-b border-white/10 flex items-center px-4 gap-4">
      <div className="flex-1 max-w-[50%]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 text-sm focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
            data-testid="input-lab-search"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-auto">
        {showOrgProjectSelectors && (
          <>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/40" />
              <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
                <SelectTrigger 
                  className="w-[180px] bg-white/5 border-white/10 text-white text-sm h-9"
                  data-testid="select-lab-organization"
                >
                  <SelectValue placeholder="Organization" />
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
            
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-white/40" />
              <Select 
                value={selectedProjectId || ''} 
                onValueChange={setSelectedProjectId}
                disabled={!selectedOrgId || projects.length === 0}
              >
                <SelectTrigger 
                  className="w-[180px] bg-white/5 border-white/10 text-white text-sm h-9 disabled:opacity-50"
                  data-testid="select-lab-project"
                >
                  <SelectValue placeholder="Project" />
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
        
        {rightSlot}
      </div>
    </div>
  );
}
