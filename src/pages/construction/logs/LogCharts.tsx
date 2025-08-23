import { SiteLogTimelineChart } from "@/components/charts/SiteLogTimelineChart";

interface LogChartsProps {
  siteLogTimelineData: any[];
  timelineLoading: boolean;
  timePeriod: 'days' | 'weeks' | 'months';
  setTimePeriod: (period: 'days' | 'weeks' | 'months') => void;
}

export default function LogCharts({ 
  siteLogTimelineData, 
  timelineLoading, 
  timePeriod, 
  setTimePeriod 
}: LogChartsProps) {
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