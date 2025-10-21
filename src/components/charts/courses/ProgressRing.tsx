import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

interface ProgressRingProps {
  value: number
}

export default function ProgressRing({ value = 0 }: ProgressRingProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))
  const data = [{ name: 'progress', value: normalizedValue, fill: 'var(--chart-1)' }]
  
  return (
    <div className="relative w-full h-48" data-testid="chart-progress-ring">
      <ResponsiveContainer>
        <RadialBarChart 
          innerRadius="70%" 
          outerRadius="100%" 
          data={data} 
          startAngle={90} 
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar 
            dataKey="value" 
            cornerRadius={10}
            background={{
              fill: 'var(--chart-ring-bg)'
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-progress-percentage">
          {normalizedValue.toFixed(0)}%
        </span>
        <span className="text-sm" style={{ color: 'var(--chart-grid-text)' }} data-testid="text-progress-label">Completado</span>
      </div>
    </div>
  )
}
