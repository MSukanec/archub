import { useMemo } from 'react'

interface CategoryData {
  name: string
  value: number
  color?: string
}

interface PetalCategoryChartProps {
  data: CategoryData[]
  isLoading?: boolean
  height?: number
  loadingText?: string
  emptyText?: string
}

const COLORS = [
  'hsl(0, 0%, 85%)',
  'hsl(0, 0%, 70%)',
  'hsl(0, 0%, 55%)',
  'hsl(0, 0%, 45%)',
  'hsl(0, 0%, 60%)',
  'hsl(0, 0%, 75%)',
  'hsl(0, 0%, 50%)',
  'hsl(0, 0%, 65%)',
]

function createPetalPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number = 12
): string {
  const angleRad = (angle: number) => (angle * Math.PI) / 180
  
  const midAngle = (startAngle + endAngle) / 2
  const angleSpread = Math.abs(endAngle - startAngle)
  
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
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles'
}: PetalCategoryChartProps) {
  
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
    const count = data.length
    const anglePerItem = 360 / count
    const gap = 3
    
    return data.map((item, index) => {
      const startAngle = -90 + index * anglePerItem + gap / 2
      const endAngle = -90 + (index + 1) * anglePerItem - gap / 2
      const midAngle = (startAngle + endAngle) / 2
      
      return {
        ...item,
        color: item.color || COLORS[index % COLORS.length],
        startAngle,
        endAngle,
        midAngle,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
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
          
          const truncatedName = item.name.length > 10 
            ? item.name.substring(0, 9) + '…' 
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
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
              <text
                x={labelX}
                y={labelY - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-semibold fill-foreground pointer-events-none"
              >
                {item.value}
              </text>
              <text
                x={labelX}
                y={labelY + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] fill-muted-foreground pointer-events-none"
              >
                {truncatedName}
              </text>
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
