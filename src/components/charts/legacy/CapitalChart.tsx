import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, subMonths, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Movement {
  movement_date: string;
  amount: number;
  movement_data?: {
    type?: {
      name: string;
    };
    currency?: {
      code: string;
    };
  };
}

interface CapitalChartProps {
  movements: Movement[];
  primaryCurrencyCode: string;
}

type Period = 'Semana' | 'Mes' | 'Trimestre' | 'Año';

interface ChartDataPoint {
  date: string;
  displayDate: string;
  dailyBalance: number;
  cumulativeBalance: number;
  income: number;
  expense: number;
  cumulativeIncome: number;
  cumulativeExpense: number;
}

interface CapitalChartPropsExtended extends CapitalChartProps {
  selectedPeriod: Period;
}

export function CapitalChart({ movements, primaryCurrencyCode, selectedPeriod }: CapitalChartPropsExtended) {

  const { chartData, totalBalance, maxValue, minValue, isYearView } = useMemo(() => {
    if (!movements || movements.length === 0) {
      return { chartData: [], totalBalance: 0, maxValue: 0, minValue: 0, isYearView: false };
    }

    // Filter movements by selected period
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

    // Filter movements within period and by primary currency
    const filteredMovements = movements.filter(m => {
      const movementDate = parseISO(m.movement_date);
      const isInPeriod = isWithinInterval(movementDate, { start: startDate, end: now });
      const isPrimaryCurrency = m.movement_data?.currency?.code === primaryCurrencyCode;
      return isInPeriod && isPrimaryCurrency;
    });

    // Group movements by day
    const dailyData = new Map<string, { income: number; expense: number }>();
    
    filteredMovements.forEach(movement => {
      const date = startOfDay(parseISO(movement.movement_date)).toISOString().split('T')[0];
      const typeName = movement.movement_data?.type?.name?.toLowerCase() || '';
      const amount = Math.abs(movement.amount || 0);
      
      if (!dailyData.has(date)) {
        dailyData.set(date, { income: 0, expense: 0 });
      }
      
      const dayData = dailyData.get(date)!;
      
      if (typeName.includes('ingreso')) {
        dayData.income += amount;
      } else if (typeName.includes('egreso')) {
        dayData.expense += amount;
      }
    });

    // Create array of all dates in period
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build chart data with cumulative balance, income, and expense
    let cumulativeBalance = 0;
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    const dateFormat = selectedPeriod === 'Año' ? 'MMM' : 'dd MMM';
    const data: ChartDataPoint[] = dates.map((date, index) => {
      const dayData = dailyData.get(date) || { income: 0, expense: 0 };
      const dailyBalance = dayData.income - dayData.expense;
      cumulativeBalance += dailyBalance;
      cumulativeIncome += dayData.income;
      cumulativeExpense += dayData.expense;
      
      return {
        date,
        displayDate: format(parseISO(date), dateFormat, { locale: es }),
        dailyBalance,
        cumulativeBalance,
        income: dayData.income,
        expense: dayData.expense,
        cumulativeIncome,
        cumulativeExpense,
      };
    });

    // Calculate total balance (final cumulative balance)
    const totalBalance = cumulativeBalance;

    // Find max and min values for scaling
    const allBalances = data.map(d => d.dailyBalance);
    const maxValue = Math.max(...allBalances, 0);
    const minValue = Math.min(...allBalances, 0);

    return { chartData: data, totalBalance, maxValue, minValue, isYearView: selectedPeriod === 'Año' };
  }, [movements, selectedPeriod, primaryCurrencyCode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.cumulativeBalance >= 0;
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">{format(parseISO(data.date), 'dd MMM yyyy', { locale: es })}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Balance: <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                $ {data.cumulativeBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </p>
            {data.income > 0 && (
              <p className="text-xs text-muted-foreground">
                Ingresos del día: <span className="text-green-600">
                  $ {data.income.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
            {data.expense > 0 && (
              <p className="text-xs text-muted-foreground">
                Egresos del día: <span className="text-red-600">
                  $ {data.expense.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
      {/* Chart - más alto */}
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
          
          {/* Bars for daily balance */}
          <Bar dataKey="dailyBalance" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.dailyBalance >= 0 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 80%)'}
              />
            ))}
          </Bar>
          
          {/* Line for cumulative balance */}
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
