export const GanttGrid = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayDate = today.getDate();
  
  // Generate array of days for current month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {/* Left panel - title column */}
      <div className="w-64 h-10 flex items-center px-4 border-r border-gray-200 bg-gray-100">
        <span className="text-sm font-medium text-gray-700">Elementos</span>
      </div>
      
      {/* Timeline header */}
      <div className="flex">
        {days.map((day) => (
          <div
            key={day}
            className={`w-10 h-10 flex items-center justify-center border-r border-gray-200 text-xs font-medium ${
              day === todayDate 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};