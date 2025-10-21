import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface MiniBarProps {
  data: { name: string; value: number }[]
}

export default function MiniBar({ data }: MiniBarProps) {
  return (
    <div className="w-full h-28" data-testid="chart-mini-bar">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: 'var(--chart-grid-text)' }}
            stroke="var(--border)"
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              color: 'var(--card-text)'
            }}
            cursor={{ fill: 'hsl(0, 0%, 95%)' }}
          />
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="var(--chart-1)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
