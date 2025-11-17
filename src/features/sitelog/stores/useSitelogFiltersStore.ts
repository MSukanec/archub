import { create } from 'zustand';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SitelogFiltersState {
  creator: string[];
  dateRange: DateRange;
  type: string[];
  searchText: string;
  setCreatorFilter: (creators: string[]) => void;
  setDateRange: (range: DateRange) => void;
  setTypeFilter: (types: string[]) => void;
  setSearchText: (text: string) => void;
  resetFilters: () => void;
  getFilteredLogs: (logs: any[]) => any[];
}

const initialState = {
  creator: [],
  dateRange: { from: undefined, to: undefined },
  type: [],
  searchText: ''
};

export const useSitelogFiltersStore = create<SitelogFiltersState>((set, get) => ({
  ...initialState,

  setCreatorFilter: (creators: string[]) => set({ creator: creators }),
  
  setDateRange: (range: DateRange) => set({ dateRange: range }),
  
  setTypeFilter: (types: string[]) => set({ type: types }),
  
  setSearchText: (text: string) => set({ searchText: text }),
  
  resetFilters: () => set(initialState),

  getFilteredLogs: (logs: any[]) => {
    const { creator, dateRange, type, searchText } = get();
    
    return logs.filter((log) => {
      if (creator.length > 0 && !creator.includes(log.created_by)) {
        return false;
      }

      if (dateRange.from || dateRange.to) {
        const logDate = parseISO(log.log_date);
        
        if (dateRange.from && dateRange.to) {
          const isInRange = isWithinInterval(logDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          });
          if (!isInRange) return false;
        } else if (dateRange.from) {
          if (logDate < startOfDay(dateRange.from)) return false;
        } else if (dateRange.to) {
          if (logDate > endOfDay(dateRange.to)) return false;
        }
      }

      if (type.length > 0 && !type.includes(log.entry_type)) {
        return false;
      }

      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase();
        const matchesComment = log.comments?.toLowerCase().includes(searchLower);
        const matchesCreator = log.creator?.full_name?.toLowerCase().includes(searchLower);
        
        if (!matchesComment && !matchesCreator) {
          return false;
        }
      }

      return true;
    });
  }
}));
