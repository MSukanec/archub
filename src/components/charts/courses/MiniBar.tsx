import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
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
          />
          <Bar 
            dataKey="value" 
            fill="var(--accent)" 
            radius={[6, 6, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
