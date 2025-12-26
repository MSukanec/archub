import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  dailyBalance: number;
  cumulativeBalance: number;
  inflow: number;
  outflow: number;
}

export interface CapitalChartProps {
  chartData: ChartDataPoint[];
  isYearView?: boolean;
}

export function CapitalChart({ chartData, isYearView = false }: CapitalChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.cumulativeBalance >= 0;
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">{format(parseISO(data.date), 'dd MMM yyyy')}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Balance: <span className={isPositive ? 'text-chart-positive' : 'text-chart-negative'}>
                {data.cumulativeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </p>
            {data.inflow > 0 && (
              <p className="text-xs text-muted-foreground">
                Inflow: <span className="text-chart-positive">
                  {data.inflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
            {data.outflow > 0 && (
              <p className="text-xs text-muted-foreground">
                Outflow: <span className="text-chart-negative">
                  {data.outflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
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
              if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value.toFixed(0);
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          
          <Bar dataKey="dailyBalance" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.dailyBalance >= 0 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 80%)'}
              />
            ))}
          </Bar>
          
          <Line
            type="monotone"
            dataKey="cumulativeBalance"
            stroke="hsl(var(--accent-hsl))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
