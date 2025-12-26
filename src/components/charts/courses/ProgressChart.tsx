import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, subMonths, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface LessonProgress {
  updated_at: string;
  last_position_sec: number;
  is_completed: boolean;
}

interface ProgressChartProps {
  progressData: LessonProgress[];
  selectedPeriod: 'Semana' | 'Mes' | 'Trimestre' | 'Año';
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  hours: number;
  minutes: number;
  totalSeconds: number;
}

export function ProgressChart({ progressData, selectedPeriod }: ProgressChartProps) {
  const { chartData, totalHours, maxValue, isYearView } = useMemo(() => {
    if (!progressData || progressData.length === 0) {
      return { chartData: [], totalHours: 0, maxValue: 0, isYearView: false };
    }

    // Filter progress by selected period
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'Semana':
        startDate = subDays(now, 7);
        break;
      case 'Mes':
        startDate = subDays(now, 30);
        break;
      case 'Trimestre':
        startDate = subMonths(now, 3);
        break;
      case 'Año':
        startDate = subMonths(now, 12);
        break;
    }

    // Filter progress within period
    const filteredProgress = progressData.filter(p => {
      const progressDate = parseISO(p.updated_at);
      return isWithinInterval(progressDate, { start: startDate, end: now });
    });

    // Group progress by day
    const dailyData = new Map<string, number>();
    
    filteredProgress.forEach(progress => {
      const date = startOfDay(parseISO(progress.updated_at)).toISOString().split('T')[0];
      const seconds = progress.last_position_sec || 0;
      
      if (!dailyData.has(date)) {
        dailyData.set(date, 0);
      }
      
      dailyData.set(date, dailyData.get(date)! + seconds);
    });

    // Create array of all dates in period
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build chart data
    const dateFormat = selectedPeriod === 'Año' ? 'MMM' : 'dd MMM';
    const data: ChartDataPoint[] = dates.map((date) => {
      const totalSeconds = dailyData.get(date) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      return {
        date,
        displayDate: format(parseISO(date), dateFormat, { locale: es }),
        hours: totalSeconds / 3600, // Convert to decimal hours for chart
        minutes,
        totalSeconds,
      };
    });

    // Calculate total hours
    const totalSeconds = Array.from(dailyData.values()).reduce((sum, s) => sum + s, 0);
    const totalHours = totalSeconds / 3600;

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.hours), 0);

    return { chartData: data, totalHours, maxValue, isYearView: selectedPeriod === 'Año' };
  }, [progressData, selectedPeriod]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hours = Math.floor(data.totalSeconds / 3600);
      const minutes = Math.floor((data.totalSeconds % 3600) / 60);
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">
            {format(parseISO(data.date), 'dd MMM yyyy', { locale: es })}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Tiempo dedicado: <span className="text-accent font-medium">
                {hours > 0 ? `${hours} HS ` : ''}{minutes > 0 ? `${minutes} MIN` : '0 MIN'}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" vertical={false} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: 'hsl(0, 0%, 60%)' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(0, 0%, 85%)' }}
            interval={isYearView ? Math.floor(chartData.length / 12) : 'preserveStartEnd'}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(0, 0%, 60%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value === 0) return '0';
              if (value < 1) return `${Math.round(value * 60)}m`;
              return `${Math.round(value)}h`;
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          
          {/* Bars for daily hours */}
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="hsl(var(--accent-hsl))"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
