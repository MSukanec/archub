import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface LineStreakProps {
  data: { day: string; active: number }[]
}

export default function LineStreak({ data }: LineStreakProps) {
  return (
    <div className="w-full h-28" data-testid="chart-line-streak">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="day" hide />
          <YAxis hide domain={[0, 1]} />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              color: 'var(--card-text)'
            }}
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
            }}
            formatter={(value: number) => [value === 1 ? 'Activo' : 'Inactivo', 'Estado']}
          />
          <Line 
            type="monotone" 
            dataKey="active" 
            stroke="var(--accent)" 
            strokeWidth={2}
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
