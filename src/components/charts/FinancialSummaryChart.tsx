import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
// Format currency helper
const formatCurrency = (amount: number, currency: string = '$') => {
  return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
};

interface FinancialSummaryData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency: string;
}

interface FinancialSummaryChartProps {
  data: FinancialSummaryData;
}

export const FinancialSummaryChart: React.FC<FinancialSummaryChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Ingresos',
      value: data.totalIncome,
      color: 'var(--accent)',
    },
    {
      name: 'Egresos',
      value: Math.abs(data.totalExpenses),
      color: '#ef4444',
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[var(--card-bg)] p-3 rounded-lg border border-[var(--card-border)] shadow-lg">
          <p className="font-medium text-[var(--card-text)]">{data.payload.name}</p>
          <p className="text-sm text-[var(--muted-text)]">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="rounded-lg border border-[var(--card-border)] p-6"
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--card-text)]">
          Resumen General
        </h3>
        <div className="text-right">
          <p className="text-sm text-[var(--muted-text)]">Balance Total</p>
          <p className={`text-xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.balance)}
          </p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span style={{ color: 'var(--card-text)' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};