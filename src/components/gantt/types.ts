export type GanttRowProps = {
  id: string;
  name: string;
  type: 'task' | 'group';
  level: number;
  startDate?: string;
  endDate?: string;           // Optional: exact end date
  durationInDays?: number;    // Optional: duration in days from start
  isHeader?: boolean;         // True for group headers
  onClick?: (item: GanttRowProps) => void;
};

export type GanttContainerProps = {
  data: GanttRowProps[];
  onItemClick?: (item: GanttRowProps) => void;
};

export interface ResolvedDateRange {
  startDate: Date;
  resolvedEndDate: Date;
  wasCalculated: boolean;
  isValid: boolean;
  durationInDays: number;
}

// Utility function to calculate resolved end date with proper validation
export function calculateResolvedEndDate(item: GanttRowProps): ResolvedDateRange {
  // Skip validation for groups/headers - they don't need dates
  if (item.type === 'group' || item.isHeader || !item.startDate) {
    return {
      startDate: new Date(),
      resolvedEndDate: new Date(),
      wasCalculated: false,
      isValid: true,
      durationInDays: 1
    };
  }

  // Normalize startDate to avoid UTC interpretation issues
  const startDate = new Date(item.startDate + 'T00:00:00');
  
  console.log('Date calculation for item:', {
    itemId: item.id,
    originalStartDate: item.startDate,
    parsedStartDate: startDate.toDateString(),
    originalEndDate: item.endDate,
    durationInDays: item.durationInDays
  });
  
  // Validate that startDate is a valid date
  if (isNaN(startDate.getTime())) {
    console.warn(`Invalid start date for item ${item.id}: ${item.startDate}`);
    const today = new Date();
    return {
      startDate: today,
      resolvedEndDate: today,
      wasCalculated: false,
      isValid: false,
      durationInDays: 1
    };
  }
  
  // Calculate resolved end date with priority logic
  let resolvedEndDate: Date;
  let wasCalculated = false;
  
  if (item.endDate) {
    // Priority 1: Use endDate if provided and normalize
    resolvedEndDate = new Date(item.endDate + 'T00:00:00');
    if (isNaN(resolvedEndDate.getTime())) {
      // If endDate is invalid, fallback to startDate
      resolvedEndDate = new Date(startDate.getTime());
    }
    console.log('Using endDate:', resolvedEndDate.toDateString());
  } else if (item.durationInDays && item.durationInDays > 0) {
    // Priority 2: Calculate from durationInDays using normalized date methods
    resolvedEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + item.durationInDays - 1);
    wasCalculated = true;
    console.log('Calculated endDate from duration:', {
      duration: item.durationInDays,
      calculatedEndDate: resolvedEndDate.toDateString()
    });
  } else {
    // Fallback: 1 day duration (same day start and end)
    resolvedEndDate = new Date(startDate.getTime());
    console.log('Using fallback same-day endDate:', resolvedEndDate.toDateString());
  }
  
  // Validate dates - if start > end, use same day
  const isValid = startDate.getTime() <= resolvedEndDate.getTime();
  if (!isValid) {
    console.warn(`Invalid date range for item ${item.id}: startDate > endDate`);
    resolvedEndDate = new Date(startDate.getTime());
    wasCalculated = false;
  }
  
  // Calculate actual duration in days
  const actualDurationInDays = Math.ceil((resolvedEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  
  return {
    startDate,
    resolvedEndDate,
    wasCalculated,
    isValid,
    durationInDays: actualDurationInDays
  };
}