import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface RadialGridData {
  name: string
  children: Array<{
    name: string
    value: number
    percentage: number
  }>
}

interface ExpensesRadialGridChartProps {
  data: RadialGridData[]
  isLoading?: boolean
}

export function ExpensesRadialGridChart({ data, isLoading }: ExpensesRadialGridChartProps) {
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
    svg.selectAll("*").remove()

    const width = 800
    const height = 600
    const centerX = width / 2
    const centerY = height / 2
    const outerRadius = Math.min(width, height) / 2 - 80
    const innerRadius = 120

    // Color scales for each category
    const colorScales = {
      'Mano de Obra': d3.scaleSequential(d3.interpolateGreens).domain([0.3, 1]),
      'Materiales': d3.scaleSequential(d3.interpolateReds).domain([0.3, 1]),
      'Indirectos': d3.scaleSequential(d3.interpolateOranges).domain([0.3, 1])
    }

    // Calculate total for size scaling
    const totalValue = data.reduce((sum, category) => 
      sum + category.children.reduce((catSum, item) => catSum + item.value, 0), 0
    )

    // Create main SVG
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`)

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'radial-grid-tooltip')
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

    // Process data for radial layout
    let currentAngle = 0
    const angleStep = (2 * Math.PI) / data.length

    data.forEach((category, categoryIndex) => {
      const categoryStartAngle = currentAngle
      const categoryEndAngle = currentAngle + angleStep
      const categoryMidAngle = (categoryStartAngle + categoryEndAngle) / 2

      // Sort subcategories by value (largest first)
      const sortedSubcategories = [...category.children].sort((a, b) => b.value - a.value)
      
      // Create concentric rings for subcategories
      const numRings = Math.min(sortedSubcategories.length, 8) // Limit to 8 rings
      const ringStep = (outerRadius - innerRadius) / numRings

      sortedSubcategories.slice(0, numRings).forEach((subcategory, subIndex) => {
        const ringRadius = innerRadius + (subIndex + 1) * ringStep
        const intensity = 0.4 + (subcategory.value / totalValue) * 200 // Scale intensity based on value
        const color = colorScales[category.name as keyof typeof colorScales](Math.min(intensity, 1))

        // Calculate number of squares for this ring based on value
        const baseSquares = 24 // Base number of squares per ring
        const categoryPortion = angleStep / (2 * Math.PI)
        const squaresInCategoryArc = Math.floor(baseSquares * categoryPortion)
        const squareAngleStep = angleStep / squaresInCategoryArc

        // Create squares in this ring for this category
        for (let i = 0; i < squaresInCategoryArc; i++) {
          const squareAngle = categoryStartAngle + i * squareAngleStep + squareAngleStep / 2
          const squareSize = Math.max(3, ringStep * 0.6) // Minimum size 3px
          
          // Calculate position
          const x = Math.cos(squareAngle - Math.PI / 2) * ringRadius
          const y = Math.sin(squareAngle - Math.PI / 2) * ringRadius

          g.append('rect')
            .attr('x', x - squareSize / 2)
            .attr('y', y - squareSize / 2)
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(event) {
              d3.select(this)
                .transition()
                .duration(150)
                .attr('stroke-width', 2)
                .attr('stroke', '#333')

              tooltip.transition()
                .duration(200)
                .style('opacity', 1)

              tooltip.html(`
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--foreground);">
                  ${category.name} → ${subcategory.name}
                </div>
                <div style="color: var(--muted-foreground); margin-bottom: 4px;">
                  Monto: <span style="font-weight: 500; color: var(--foreground);">${formatCurrency(subcategory.value)}</span>
                </div>
                <div style="color: var(--muted-foreground);">
                  Incidencia: <span style="font-weight: 500; color: var(--foreground);">${subcategory.percentage}%</span>
                </div>
              `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
            })
            .on('mouseout', function() {
              d3.select(this)
                .transition()
                .duration(150)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff')

              tooltip.transition()
                .duration(200)
                .style('opacity', 0)
            })
            .on('mousemove', function(event) {
              tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
            })
        }
      })

      // Add category labels around the outside
      const labelRadius = outerRadius + 30
      const labelX = Math.cos(categoryMidAngle - Math.PI / 2) * labelRadius
      const labelY = Math.sin(categoryMidAngle - Math.PI / 2) * labelRadius

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', 'var(--foreground)')
        .text(category.name)

      currentAngle += angleStep
    })

    // Add center circle with title
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', innerRadius - 10)
      .attr('fill', 'var(--card)')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 2)

    // Center title
    g.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', 'var(--foreground)')
      .text('Análisis de')

    g.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', 'var(--foreground)')
      .text('Obra')

    g.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'var(--muted-foreground)')
      .text('Por Rubro y Subcategoría')

    // Cleanup
    return () => {
      tooltip.remove()
    }
  }, [data, isLoading])

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando visualización radial...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de subcategorías</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="flex justify-center">
        <svg ref={svgRef} className="overflow-visible" />
      </div>

      {/* Legend */}
      <div className="mt-6 border-t pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">
          Distribución Radial por Categorías:
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-green-600 to-green-400" />
            <span>Mano de Obra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-red-600 to-red-400" />
            <span>Materiales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-orange-600 to-orange-400" />
            <span>Indirectos</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium">Intensidad del color:</span> representa el monto de cada subcategoría. 
          <span className="font-medium ml-2">Anillos concéntricos:</span> subcategorías ordenadas por valor.
        </div>
      </div>
    </div>
  )
}