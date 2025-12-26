interface SparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function MiniSparkline({ data, color = 'var(--accent)', height = 48 }: SparklineProps) {
  if (!data || data.length === 0 || !data.some(v => v !== 0)) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
  }

  const width = 140
  const padding = 2
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max === min ? 1 : max - min

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth
    const y = padding + innerHeight - ((v - min) / range) * innerHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
