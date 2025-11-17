import { SiteLogTimelineChart } from "@/components/charts/SiteLogTimelineChart";

interface SitelogChartsProps {
  siteLogTimelineData: any[];
  timelineLoading: boolean;
  timePeriod: 'days' | 'weeks' | 'months';
  setTimePeriod: (period: 'days' | 'weeks' | 'months') => void;
}

export default function SitelogChartsTab({ 
  siteLogTimelineData, 
  timelineLoading, 
  timePeriod, 
  setTimePeriod 
}: SitelogChartsProps) {
  return (
    <div className="space-y-6">
      {/* Timeline Chart */}
      <SiteLogTimelineChart 
        data={siteLogTimelineData} 
        isLoading={timelineLoading}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
      />
    </div>
  );
}
