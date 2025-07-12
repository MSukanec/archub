import React from 'react'
import { ReusablePieChart } from './ReusablePieChart'

interface ExpensesCategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpensesByCategoryChartProps {
  data: ExpensesCategoryData[]
  isLoading?: boolean
}

export function ExpensesByCategoryChart({ data, isLoading }: ExpensesByCategoryChartProps) {
  // Transform data to match ReusablePieChart format
  const transformedData = data?.map(item => ({
    name: item.category,
    value: item.amount,
    color: item.color,
    percentage: item.percentage
  })) || []

  return (
    <ReusablePieChart
      data={transformedData}
      isLoading={isLoading}
      dataKey="value"
      nameKey="name"
      loadingText="Cargando categorías..."
      emptyText="No hay datos de egresos por categoría"
      showPercentageLabels={true}
      minPercentageToShowLabel={5}
    />
  )
}