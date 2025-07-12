import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface OrganizationGrowthData {
  date: string;
  organizations: number;
  cumulative: number;
}

type PeriodType = 'days' | 'weeks' | 'months';

function useOrganizationGrowthData(period: PeriodType) {
  return useQuery({
    queryKey: ['organization-growth', period],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      // Calculate date range based on period
      const endDate = new Date();
      let startDate: Date;
      let dateRange: Date[];
      let formatPattern: string;
      let groupPattern: string;

      switch (period) {
        case 'days':
          startDate = subDays(endDate, 30);
          dateRange = eachDayOfInterval({ start: startDate, end: endDate });
          formatPattern = 'dd/MM';
          groupPattern = 'yyyy-MM-dd';
          break;
        case 'weeks':
          startDate = subWeeks(endDate, 12);
          dateRange = eachWeekOfInterval({ start: startDate, end: endDate }, { locale: es });
          formatPattern = 'dd/MM';
          groupPattern = 'yyyy-ww';
          break;
        case 'months':
          startDate = subMonths(endDate, 12);
          dateRange = eachMonthOfInterval({ start: startDate, end: endDate });
          formatPattern = 'MMM yyyy';
          groupPattern = 'yyyy-MM';
          break;
        default:
          startDate = subDays(endDate, 30);
          dateRange = eachDayOfInterval({ start: startDate, end: endDate });
          formatPattern = 'dd/MM';
          groupPattern = 'yyyy-MM-dd';
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group organizations by period
      const orgsByPeriod: { [key: string]: number } = {};
      data.forEach(org => {
        const date = new Date(org.created_at);
        let periodKey: string;

        switch (period) {
          case 'days':
            periodKey = format(date, 'yyyy-MM-dd');
            break;
          case 'weeks':
            periodKey = format(startOfWeek(date, { locale: es }), 'yyyy-MM-dd');
            break;
          case 'months':
            periodKey = format(startOfMonth(date), 'yyyy-MM-dd');
            break;
          default:
            periodKey = format(date, 'yyyy-MM-dd');
        }
        
        orgsByPeriod[periodKey] = (orgsByPeriod[periodKey] || 0) + 1;
      });

      // Create chart data with cumulative count
      let cumulative = 0;
      const chartData: OrganizationGrowthData[] = dateRange.map(date => {
        let periodKey: string;
        let displayDate: string;

        switch (period) {
          case 'days':
            periodKey = format(date, 'yyyy-MM-dd');
            displayDate = format(date, formatPattern, { locale: es });
            break;
          case 'weeks':
            periodKey = format(date, 'yyyy-MM-dd');
            displayDate = format(date, formatPattern, { locale: es });
            break;
          case 'months':
            periodKey = format(date, 'yyyy-MM-dd');
            displayDate = format(date, formatPattern, { locale: es });
            break;
          default:
            periodKey = format(date, 'yyyy-MM-dd');
            displayDate = format(date, formatPattern, { locale: es });
        }

        const periodCount = orgsByPeriod[periodKey] || 0;
        cumulative += periodCount;
        
        return {
          date: displayDate,
          organizations: periodCount,
          cumulative
        };
      });

      return chartData;
    }
  });
}

export function OrganizationGrowthChart() {
  const [period, setPeriod] = useState<PeriodType>('days');
  const { data, isLoading, error } = useOrganizationGrowthData(period);

  const getPeriodLabel = (periodType: PeriodType) => {
    switch (periodType) {
      case 'days': return 'Días';
      case 'weeks': return 'Semanas';
      case 'months': return 'Meses';
      default: return 'Días';
    }
  };

  const getPeriodDescription = () => {
    switch (period) {
      case 'days': return 'los últimos 30 días';
      case 'weeks': return 'las últimas 12 semanas';
      case 'months': return 'los últimos 12 meses';
      default: return 'los últimos 30 días';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Crecimiento de Organizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Cargando datos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Crecimiento de Organizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Error al cargar datos</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOrganizations = data?.[data.length - 1]?.cumulative || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Crecimiento de Organizaciones</CardTitle>
            <div className="text-sm text-muted-foreground">
              {totalOrganizations} organizaciones registradas en {getPeriodDescription()}
            </div>
          </div>
          <div className="flex gap-1">
            {(['days', 'weeks', 'months'] as PeriodType[]).map((periodType) => (
              <Button
                key={periodType}
                variant={period === periodType ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(periodType)}
                className="text-xs"
              >
                {getPeriodLabel(periodType)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fill: 'var(--chart-grid-text)' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'var(--chart-grid-text)' }}
              />
              <Tooltip 
                labelFormatter={(label) => `Fecha: ${label}`}
                formatter={(value, name) => [
                  value, 
                  name === 'cumulative' ? 'Total Acumulado' : 'Nuevas del Día'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="hsl(110, 40%, 50%)"
                strokeWidth={3}
                connectNulls={true}
                dot={{ fill: "hsl(110, 40%, 50%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(110, 40%, 50%)", strokeWidth: 2, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}