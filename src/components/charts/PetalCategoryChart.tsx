import { useMemo, useState } from 'react'

interface CategoryData {
  name: string
  value: number
  color?: string
}

interface PetalCategoryChartProps {
  data: CategoryData[]
  isLoading?: boolean
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
}

const COLORS = [
  'hsl(76, 100%, 40%)',
  'hsl(173, 58%, 39%)',
  'hsl(197, 37%, 24%)',
  'hsl(43, 74%, 49%)',
  'hsl(27, 87%, 67%)',
  'hsl(12, 76%, 61%)',
  'hsl(340, 75%, 55%)',
  'hsl(262, 52%, 47%)',
]

function createPetalPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const angleRad = (angle: number) => (angle * Math.PI) / 180
  
  const innerStart = {
    x: cx + innerRadius * Math.cos(angleRad(startAngle)),
    y: cy + innerRadius * Math.sin(angleRad(startAngle))
  }
  const innerEnd = {
    x: cx + innerRadius * Math.cos(angleRad(endAngle)),
    y: cy + innerRadius * Math.sin(angleRad(endAngle))
  }
  const outerStart = {
    x: cx + outerRadius * Math.cos(angleRad(startAngle)),
    y: cy + outerRadius * Math.sin(angleRad(startAngle))
  }
  const outerEnd = {
    x: cx + outerRadius * Math.cos(angleRad(endAngle)),
    y: cy + outerRadius * Math.sin(angleRad(endAngle))
  }
  
  const angleSpread = Math.abs(endAngle - startAngle)
  const largeArcFlag = angleSpread > 180 ? 1 : 0
  
  return `
    M ${innerStart.x} ${innerStart.y}
    L ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
    Z
  `
}

export function PetalCategoryChart({
  data,
  isLoading = false,
  height = 280,
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value),
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles'
}: PetalCategoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{loadingText}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      </div>
    )
  }

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const gap = 2
    
    let currentAngle = -90
    
    return data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0
      const angleSpread = (percentage / 100) * 360 - gap
      const startAngle = currentAngle
      const endAngle = currentAngle + angleSpread
      const midAngle = (startAngle + endAngle) / 2
      
      currentAngle = endAngle + gap
      
      return {
        ...item,
        color: item.color || COLORS[index % COLORS.length],
        startAngle,
        endAngle,
        midAngle,
        percentage: percentage.toFixed(1)
      }
    })
  }, [data])

  const size = Math.min(height, 280)
  const cx = size / 2
  const cy = size / 2
  const innerRadius = size * 0.18
  const outerRadius = size * 0.45

  return (
    <div style={{ height }} className="flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {chartData.map((item, index) => {
          const midAngleRad = (item.midAngle * Math.PI) / 180
          const labelRadius = (innerRadius + outerRadius) / 2
          const labelX = cx + labelRadius * Math.cos(midAngleRad)
          const labelY = cy + labelRadius * Math.sin(midAngleRad)
          
          const truncatedName = item.name.length > 12 
            ? item.name.substring(0, 11) + '…' 
            : item.name

          return (
            <g key={index}>
              <path
                d={createPetalPath(
                  cx,
                  cy,
                  innerRadius,
                  outerRadius,
                  item.startAngle,
                  item.endAngle
                )}
                fill={item.color}
                opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
                className="transition-opacity duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-semibold fill-foreground pointer-events-none"
                style={{ fontWeight: 600 }}
              >
                {truncatedName}
              </text>
              
              {hoveredIndex === index && (
                <g>
                  <rect
                    x={cx - 60}
                    y={cy - 50}
                    width="120"
                    height="60"
                    rx="6"
                    fill="var(--popover)"
                    stroke="var(--border)"
                    className="shadow-lg"
                  />
                  <text
                    x={cx}
                    y={cy - 35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[11px] font-semibold fill-popover-foreground"
                  >
                    {item.name}
                  </text>
                  <text
                    x={cx}
                    y={cy - 20}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-popover-foreground opacity-80"
                  >
                    {valueFormatter(item.value)}
                  </text>
                  <text
                    x={cx}
                    y={cy - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-popover-foreground opacity-80"
                  >
                    {item.percentage}%
                  </text>
                </g>
              )}
            </g>
          )
        })}
        
        <circle
          cx={cx}
          cy={cy}
          r={innerRadius - 2}
          className="fill-background"
        />
      </svg>
    </div>
  )
}
