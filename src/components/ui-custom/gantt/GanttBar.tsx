interface GanttBarProps {
  startDate: string;
  endDate: string;
  title: string;
  assignee: string;
}

export const GanttBar = ({ startDate, endDate, title, assignee }: GanttBarProps) => {
  const calculatePosition = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Check if dates are in current month/year
    if (start.getMonth() !== currentMonth || start.getFullYear() !== currentYear) {
      return null;
    }
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const duration = endDay - startDay + 1;
    
    // Each day is 40px wide (w-10)
    const left = (startDay - 1) * 40;
    const width = duration * 40;
    
    return { left, width };
  };

  const position = calculatePosition();
  
  if (!position) return null;

  return (
    <div
      className="absolute top-2 h-5 bg-gray-700 rounded-sm flex items-center px-2 cursor-pointer hover:bg-gray-800 transition-colors"
      style={{ 
        left: `${position.left}px`, 
        width: `${position.width}px` 
      }}
      title={`${title} (${assignee})\n${startDate} - ${endDate}`}
    >
      <span className="text-xs text-white font-medium truncate mr-2">
        {title}
      </span>
      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] text-gray-700 font-medium">
          {assignee.charAt(0)}
        </span>
      </div>
    </div>
  );
};