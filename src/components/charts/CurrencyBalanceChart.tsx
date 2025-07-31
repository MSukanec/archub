import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Format currency helper
const formatCurrency = (amount: number, currency: string = '$', abbreviated: boolean = false) => {
  if (abbreviated && Math.abs(amount) >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(0)}k`;
  }
  return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
};

interface CurrencyBalance {
  currency: string;
  balance: number;
  color: string;
}

interface CurrencyBalanceChartProps {
  data: CurrencyBalance[];
}

export const CurrencyBalanceChart: React.FC<CurrencyBalanceChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[var(--card-bg)] p-3 rounded-lg border border-[var(--card-border)] shadow-lg">
          <p className="font-medium text-[var(--card-text)]">{label}</p>
          <p className="text-sm text-[var(--muted-text)]">
            Balance: {formatCurrency(data.value)}
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--card-text)]">
          Por Moneda
        </h3>
        <p className="text-sm text-[var(--muted-text)]">
          Balance por tipo de moneda
        </p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="currency" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--card-text)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--card-text)', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value, '', true)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="balance" 
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};