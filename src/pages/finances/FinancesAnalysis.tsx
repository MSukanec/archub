import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingDown, Calculator, PieChart } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useMovements } from '@/hooks/use-movements'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'

export default function FinancesAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('finances')
  }, [setSidebarContext])

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: movements = [], isLoading } = useMovements(
    organizationId || '',
    projectId || ''
  )

  // Filter only expense movements (EGRESOS)
  const expenseMovements = movements.filter(movement => 
    movement.type === 'Egreso'
  )

  // Group expenses by category and subcategory with calculations
  const analysisData = expenseMovements.reduce((acc: any[], movement) => {
    const categoryName = movement.category || 'Sin categoría'
    const subcategoryName = movement.subcategory || 'Sin subcategoría'
    const currencySymbol = movement.currency || '$'
    const amount = movement.amount || 0

    const existingIndex = acc.findIndex(item => 
      item.category === categoryName && 
      item.subcategory === subcategoryName &&
      item.currency_symbol === currencySymbol
    )

    if (existingIndex >= 0) {
      acc[existingIndex].amount += amount
    } else {
      acc.push({
        id: `${categoryName}-${subcategoryName}-${currencySymbol}`,
        category: categoryName,
        subcategory: subcategoryName,
        currency_symbol: currencySymbol,
        amount: amount
      })
    }

    return acc
  }, [])

  // Calculate total expenses for percentage calculation
  const totalExpenses = analysisData.reduce((sum, item) => sum + item.amount, 0)

  // Add percentage calculation to each item
  const analysisWithPercentage = analysisData.map(item => ({
    ...item,
    percentage: totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(2) : '0.00'
  }))

  // Sort by amount (highest first)
  const sortedAnalysis = analysisWithPercentage.sort((a, b) => b.amount - a.amount)

  // Filter by search
  const filteredData = sortedAnalysis.filter(item =>
    item.category.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.subcategory.toLowerCase().includes(searchValue.toLowerCase())
  )

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const columns = [
    {
      key: 'category',
      label: 'Categoría',
      width: '25%',
      render: (item: any) => (
        <div className="font-medium text-sm">
          {item.category}
        </div>
      )
    },
    {
      key: 'subcategory', 
      label: 'Subcategoría',
      width: '25%',
      render: (item: any) => (
        <div className="text-sm text-muted-foreground">
          {item.subcategory}
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '15%',
      render: (item: any) => (
        <div className="text-sm">
          {item.currency_symbol}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '20%',
      render: (item: any) => (
        <div className="font-medium text-sm text-red-600 dark:text-red-400">
          {item.currency_symbol} {formatAmount(item.amount)}
        </div>
      )
    },
    {
      key: 'percentage',
      label: '% de Incidencia',
      width: '15%',
      render: (item: any) => (
        <div className="font-medium text-sm">
          {item.percentage}%
        </div>
      )
    }
  ]

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Análisis por Categoría",
      description: "Visualiza el desglose de gastos organizados por categorías y subcategorías de movimientos."
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Porcentaje de Incidencia",
      description: "Calcula automáticamente qué porcentaje representa cada concepto del total de egresos."
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Totales por Moneda",
      description: "Agrupa y suma los montos por tipo de moneda para análisis multi-divisa."
    },
    {
      icon: <TrendingDown className="w-6 h-6" />,
      title: "Ordenamiento Inteligente",
      description: "Los conceptos se ordenan automáticamente de mayor a menor impacto económico."
    }
  ]

  return (
    <Layout headerProps={{ title: "Análisis de Obra" }}>
      <div className="space-y-6">
        <FeatureIntroduction
          title="Análisis de Obra"
          features={features}
          className="md:hidden"
        />

        <ActionBarDesktop
          title="Análisis de Obra"
          icon={<BarChart3 className="w-5 h-5" />}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          features={features}
          showProjectSelector={true}
        />

        {filteredData.length > 0 ? (
          <Table
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={<BarChart3 className="h-8 w-8" />}
                title="No hay datos que coincidan"
                description="Intenta cambiar los filtros de búsqueda para encontrar los análisis que buscas."
              />
            }
          />
        ) : expenseMovements.length === 0 ? (
          <EmptyState
            icon={<TrendingDown className="h-8 w-8" />}
            title="No hay egresos registrados"
            description="Comienza registrando movimientos de egreso en la sección de Movimientos para ver el análisis de gastos por categoría."
          />
        ) : (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="No hay datos que coincidan"
            description="Intenta cambiar los filtros de búsqueda para encontrar los análisis que buscas."
          />
        )}
      </div>
    </Layout>
  )
}