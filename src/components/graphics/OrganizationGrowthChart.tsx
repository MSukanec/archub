import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizationGrowthData {
  date: string;
  organizations: number;
  cumulative: number;
}

function useOrganizationGrowthData() {
  return useQuery({
    queryKey: ['organization-growth'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      // Get organizations data for the last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      const { data, error } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Create array of all days in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Group organizations by day
      const orgsByDay: { [key: string]: number } = {};
      data.forEach(org => {
        const day = format(new Date(org.created_at), 'yyyy-MM-dd');
        orgsByDay[day] = (orgsByDay[day] || 0) + 1;
      });

      // Create chart data with cumulative count
      let cumulative = 0;
      const chartData: OrganizationGrowthData[] = dateRange.map(date => {
        const dayKey = format(date, 'yyyy-MM-dd');
        const dailyCount = orgsByDay[dayKey] || 0;
        cumulative += dailyCount;
        
        return {
          date: format(date, 'dd/MM', { locale: es }),
          organizations: dailyCount,
          cumulative
        };
      });

      return chartData;
    }
  });
}

export function OrganizationGrowthChart() {
  const { data, isLoading, error } = useOrganizationGrowthData();

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
        <CardTitle className="text-lg font-semibold">Crecimiento de Organizaciones</CardTitle>
        <div className="text-sm text-muted-foreground">
          {totalOrganizations} organizaciones registradas en los últimos 30 días
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}