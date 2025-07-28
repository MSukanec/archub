import { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingDown, Calculator, PieChart, LayoutGrid } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Badge } from '@/components/ui/badge'
import { useMovements } from '@/hooks/use-movements'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'

export default function FinancesAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  const [groupByCategory, setGroupByCategory] = useState(true)
  
  const { data: userData } = useCurrentUser()
  const { selectedProject, selectedOrganization } = useNavigationStore()
  
  const organizationId = selectedOrganization?.id || userData?.preferences?.last_organization_id
  const projectId = selectedProject?.id || userData?.preferences?.last_project_id

  // Get movements data
  const { data: movements = [], isLoading } = useMovements(
    organizationId || '',
    projectId || ''
  )

  // Filter only expense movements (EGRESOS) by UUID
  const expenseMovements = movements.filter(movement => 
    movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7'
  )

  // Group expenses by category and subcategory with calculations
  const analysisData = expenseMovements.reduce((acc: any[], movement) => {
    const category = movement.movement_data?.category?.name || 'Sin categoría'
    const subcategory = movement.movement_data?.subcategory?.name || 'Sin subcategoría'
    const currencyCode = movement.movement_data?.currency?.code || 'ARS'
    
    // Create unique key for grouping
    const key = `${category}-${subcategory}-${currencyCode}`
    
    // Find existing group or create new one
    const existingIndex = acc.findIndex(item => item.id === key)
    
    if (existingIndex >= 0) {
      acc[existingIndex].amount += movement.amount
    } else {
      acc.push({
        id: key,
        category,
        subcategory,
        currency_symbol: currencyCode,
        amount: movement.amount
      })
    }
    
    return acc
  }, [])

  // Calculate total expenses for percentage calculation
  const totalExpenses = analysisData.reduce((total, item) => total + item.amount, 0)

  // Add percentage to each item
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
      maximumFractionDigits: 2
    }).format(amount)
  }

  const columns = [
    {
      key: 'category',
      label: 'Categoría',
      width: '20%',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.category}
        </Badge>
      )
    },
    {
      key: 'subcategory',
      label: 'Subcategoría',
      width: '20%',
      render: (item: any) => (
        <Badge variant="secondary" className="text-xs">
          {item.subcategory}
        </Badge>
      )
    },
    {
      key: 'currency_symbol',
      label: 'Moneda',
      width: '15%',
      render: (item: any) => (
        <div className="font-medium text-sm">
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
          {formatAmount(item.amount)}
        </div>
      )
    },
    {
      key: 'percentage',
      label: '% de Incidencia',
      width: '25%',
      render: (item: any) => (
        <div className="font-medium text-sm">
          {item.percentage}%
        </div>
      )
    }
  ]

  // Group data by category when grouping is enabled
  const groupedData = useMemo(() => {
    if (!groupByCategory) return null
    
    const groups = filteredData.reduce((acc: { [key: string]: any[] }, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {})

    return Object.entries(groups).map(([category, items]) => ({
      category,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      totalPercentage: items.reduce((sum, item) => sum + parseFloat(item.percentage), 0).toFixed(2)
    }))
  }, [filteredData, groupByCategory])

  // Columns for grouped view (without category column)
  const groupedColumns = columns.filter(col => col.key !== 'category')

  const features = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Cálculo Automático de Porcentajes",
      description: "Calcula automáticamente el porcentaje de incidencia de cada categoría sobre el total de egresos."
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Agrupación por Categoría",
      description: "Organiza los gastos por categoría y subcategoría para un análisis detallado de la distribución."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
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
          showGrouping={true}
          groupingType={groupByCategory ? 'category' : 'none'}
          onGroupingChange={(type) => setGroupByCategory(type !== 'none')}
        />

        {filteredData.length > 0 ? (
          groupByCategory && groupedData ? (
            <Table
              columns={groupedColumns}
              data={filteredData}
              isLoading={isLoading}
              groupBy="category"
              renderGroupHeader={(groupKey: string, groupRows: any[]) => {
                const groupInfo = groupedData.find(g => g.category === groupKey)
                return (
                  <div className="flex justify-between items-center py-2 px-4 bg-muted/50 font-medium text-sm">
                    <span>{groupKey}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Total: {formatAmount(groupInfo?.totalAmount || 0)}</span>
                      <span>{groupInfo?.totalPercentage}%</span>
                    </div>
                  </div>
                )
              }}
              emptyState={
                <EmptyState
                  icon={<BarChart3 className="h-8 w-8" />}
                  title="No hay datos que coincidan"
                  description="Intenta cambiar los filtros de búsqueda para encontrar los análisis que buscas."
                />
              }
            />
          ) : (
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
          )
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