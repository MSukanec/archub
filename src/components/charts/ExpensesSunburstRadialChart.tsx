import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface SunburstData {
  name: string
  children: Array<{
    name: string
    value: number
    percentage: number
  }>
}

interface ExpensesSunburstRadialChartProps {
  data: SunburstData[]
  isLoading?: boolean
}

export function ExpensesSunburstRadialChart({ data, isLoading }: ExpensesSunburstRadialChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  useEffect(() => {
    if (!data || data.length === 0 || isLoading) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous content

    const width = 800
    const height = 500
    const radius = Math.min(width, height) / 2 - 10

    // Color scale for main categories using CSS variables
    const categoryColors = {
      'Mano de Obra': 'hsl(76, 100%, 40%)',   // --chart-1
      'Materiales': 'hsl(173, 58%, 39%)',     // --chart-2  
      'Indirectos': 'hsl(197, 37%, 24%)'      // --chart-3
    }
    
    const colorScale = d3.scaleOrdinal()
      .domain(['Mano de Obra', 'Materiales', 'Indirectos'])
      .range([categoryColors['Mano de Obra'], categoryColors['Materiales'], categoryColors['Indirectos']])

    // Create hierarchy
    const hierarchy = d3.hierarchy({ name: 'root', children: data } as any)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // Create partition layout
    const partition = d3.partition<any>()
      .size([2 * Math.PI, radius])

    const root = partition(hierarchy)

    // Create SVG
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'sunburst-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'var(--popover)')
      .style('border', '1px solid var(--border)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-size', '14px')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)')
      .style('pointer-events', 'none')
      .style('z-index', '1000')

    // Create arcs
    const arc = d3.arc<any>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)

    // Draw paths
    g.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0))
      .enter()
      .append('path')
      .attr('d', arc)
      .style('fill', (d: any) => {
        if (d.depth === 1) {
          // Main category color
          return colorScale(d.data.name) as string
        } else {
          // Subcategory - lighter version of parent color
          const parentColor = colorScale(d.parent?.data.name) as string
          return d3.color(parentColor)?.brighter(0.3)?.toString() || parentColor
        }
      })
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        // Highlight on hover
        d3.select(this)
          .transition()
          .duration(150)
          .style('opacity', 0.8)
          .style('stroke-width', 2)

        // Show tooltip
        const parentName = d.depth === 1 ? '' : d.parent?.data.name || ''
        const categoryName = d.data.name
        const value = d.value || 0
        const percentage = d.data.percentage || 0

        tooltip.transition()
          .duration(200)
          .style('opacity', 1)

        tooltip.html(`
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--foreground);">
            ${parentName ? `${parentName} → ` : ''}${categoryName}
          </div>
          <div style="color: var(--muted-foreground); margin-bottom: 4px;">
            Monto: <span style="font-weight: 500; color: var(--foreground);">${formatCurrency(value)}</span>
          </div>
          <div style="color: var(--muted-foreground);">
            Incidencia: <span style="font-weight: 500; color: var(--foreground);">${percentage}%</span>
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(150)
          .style('opacity', 1)
          .style('stroke-width', 1)

        // Hide tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0)
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })

    // Add labels for larger segments
    g.selectAll('text')
      .data(root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > 0.1))
      .enter()
      .append('text')
      .attr('transform', (d: any) => {
        const angle = (d.x0 + d.x1) / 2
        const radius = (d.y0 + d.y1) / 2
        return `rotate(${(angle * 180 / Math.PI) - 90}) translate(${radius},0) rotate(${angle > Math.PI ? 180 : 0})`
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => {
        const angle = (d.x0 + d.x1) / 2
        return angle > Math.PI ? 'end' : 'start'
      })
      .style('font-size', (d: any) => {
        const segmentSize = d.x1 - d.x0
        return segmentSize > 0.3 ? '12px' : segmentSize > 0.15 ? '10px' : '8px'
      })
      .style('font-weight', '500')
      .style('fill', '#fff')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
      .style('pointer-events', 'none')
      .text((d: any) => {
        const segmentSize = d.x1 - d.x0
        if (segmentSize < 0.05) return '' // Too small to show text
        
        const name = d.data.name
        if (segmentSize > 0.2) return name
        if (segmentSize > 0.1) return name.length > 12 ? name.substring(0, 12) + '...' : name
        return name.length > 8 ? name.substring(0, 8) + '...' : name
      })

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, isLoading])

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando gráfico sunburst...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de subcategorías</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Distribución de Costos por Rubro y Subcategoría
        </h3>
        <p className="text-sm text-muted-foreground">
          Visualización circular concéntrica de gastos por categoría principal y subcategorías
        </p>
      </div>
      
      {/* Chart */}
      <div className="flex justify-center">
        <svg ref={svgRef} className="overflow-visible" />
      </div>

      {/* Legend */}
      <div className="mt-6 border-t pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">Leyenda de Rubros:</div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'hsl(76, 100%, 40%)' }} />
            <span>Mano de Obra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'hsl(173, 58%, 39%)' }} />
            <span>Materiales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'hsl(197, 37%, 24%)' }} />
            <span>Indirectos</span>
          </div>
        </div>
      </div>
    </div>
  )
}