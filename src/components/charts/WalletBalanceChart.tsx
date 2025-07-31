import React from 'react'
import { ReusablePieChart } from './ReusablePieChart'

interface WalletBalance {
  wallet: string
  balance: number
  color: string
}

interface WalletBalanceChartProps {
  data: WalletBalance[]
  isLoading?: boolean
}

export function WalletBalanceChart({ data, isLoading }: WalletBalanceChartProps) {
  // Transform data to match ReusablePieChart format
  const transformedData = data?.map(item => ({
    name: item.wallet,
    value: Math.abs(item.balance), // Use absolute value for display
    color: item.color
  })) || []

  // Calculate percentages for the transformed data
  const total = transformedData.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercentages = transformedData.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0
  }))

  return (
    <ReusablePieChart
      data={dataWithPercentages}
      isLoading={isLoading}
      dataKey="value"
      nameKey="name"
      loadingText="Cargando datos de billeteras..."
      emptyText="No hay datos de billeteras disponibles"
      showPercentageLabels={true}
      minPercentageToShowLabel={5}
    />
  )
}