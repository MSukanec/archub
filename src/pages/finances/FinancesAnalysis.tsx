import { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingDown, Calculator, PieChart, LayoutGrid, DollarSign } from 'lucide-react'
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
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado')
  
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

  // Function to convert amounts based on currency view
  const convertAmount = (amount: number, currencyCode: string, exchangeRate: number) => {
    if (currencyView === 'discriminado') {
      return amount
    } else if (currencyView === 'pesificado') {
      return currencyCode === 'USD' ? amount * exchangeRate : amount
    } else if (currencyView === 'dolarizado') {
      return currencyCode === 'ARS' ? amount / exchangeRate : amount
    }
    return amount
  }

  // Group expenses by category and subcategory with calculations
  const analysisData = expenseMovements.reduce((acc: any[], movement) => {
    const category = movement.movement_data?.category?.name || 'Sin categoría'
    const subcategory = movement.movement_data?.subcategory?.name || 'Sin subcategoría'
    const currencyCode = movement.movement_data?.currency?.code || 'ARS'
    const exchangeRate = movement.exchange_rate || 1
    
    // Convert amount based on currency view
    const convertedAmount = convertAmount(movement.amount, currencyCode, exchangeRate)
    
    // Create unique key for grouping (include currency only if discriminado)
    const key = currencyView === 'discriminado' 
      ? `${category}-${subcategory}-${currencyCode}`
      : `${category}-${subcategory}`
    
    // Find existing group or create new one
    const existingIndex = acc.findIndex(item => item.id === key)
    
    if (existingIndex >= 0) {
      acc[existingIndex].amount += convertedAmount
    } else {
      acc.push({
        id: key,
        category,
        subcategory,
        currency_symbol: currencyView === 'discriminado' ? (currencyCode === 'USD' ? 'US$' : '$') : 
          (currencyView === 'pesificado' ? '$' : 'US$'),
        amount: convertedAmount,
        original_currency: currencyCode
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

  // Sort alphabetically by subcategory
  const sortedAnalysis = analysisWithPercentage.sort((a, b) => a.subcategory.localeCompare(b.subcategory))

  // Filter by search
  const filteredData = sortedAnalysis.filter(item =>
    item.category.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.subcategory.toLowerCase().includes(searchValue.toLowerCase())
  )

  const formatAmount = (amount: number, currencySymbol: string = 'ARS'): string => {
    const formattedNumber = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    return `${currencySymbol} ${formattedNumber}`
  }

  // Define table columns (always 4 columns, no currency column)
  const getColumns = () => {
    return [
      {
        key: 'category',
        label: 'Categoría',
        width: '25%',
        render: (item: any) => (
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        )
      },
      {
        key: 'subcategory',
        label: 'Subcategoría',
        width: '25%',
        render: (item: any) => (
          <Badge variant="secondary" className="text-xs">
            {item.subcategory}
          </Badge>
        )
      },
      {
        key: 'amount',
        label: 'Monto',
        width: '25%',
        render: (item: any) => (
          <div className="font-medium text-sm text-red-600 dark:text-red-400">
            {formatAmount(item.amount, item.currency_symbol)}
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
  }

  const columns = getColumns()

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
      items: items.sort((a, b) => a.subcategory.localeCompare(b.subcategory)),
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      totalPercentage: items.reduce((sum, item) => sum + parseFloat(item.percentage), 0).toFixed(2)
    }))
  }, [filteredData, groupByCategory])

  // Columns for grouped view (without category column)
  const getGroupedColumns = () => {
    return [
      {
        key: 'subcategory',
        label: 'Subcategoría',
        width: '40%',
        render: (item: any) => (
          <Badge variant="secondary" className="text-xs">
            {item.subcategory}
          </Badge>
        )
      },
      {
        key: 'amount',
        label: 'Monto',
        width: '30%',
        render: (item: any) => (
          <div className="font-medium text-sm text-red-600 dark:text-red-400">
            {formatAmount(item.amount, item.currency_symbol)}
          </div>
        )
      },
      {
        key: 'percentage',
        label: '% de Incidencia',
        width: '30%',
        render: (item: any) => (
          <div className="font-medium text-sm">
            {item.percentage}%
          </div>
        )
      }
    ]
  }

  const groupedColumns = getGroupedColumns()

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
          groupingType={groupByCategory ? 'subcategory' : 'none'}
          onGroupingChange={(type) => setGroupByCategory(type === 'subcategory')}
          groupingOptions={[
            { value: 'none', label: 'No agrupar' },
            { value: 'subcategory', label: 'Agrupar por Subcategoría' }
          ]}
          customGhostButtons={[
            <Button
              key="currency-view"
              variant="ghost"
              onClick={() => {
                const nextView = currencyView === 'discriminado' ? 'pesificado' : 
                                currencyView === 'pesificado' ? 'dolarizado' : 'discriminado'
                setCurrencyView(nextView)
              }}
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {currencyView === 'discriminado' ? 'Discriminado' : 
               currencyView === 'pesificado' ? 'Pesificado' : 'Dolarizado'}
            </Button>
          ]}
        />

        {filteredData.length > 0 ? (
          groupByCategory && groupedData ? (
            <Table
              columns={groupedColumns}
              data={filteredData}
              isLoading={isLoading}
              groupBy="category"
              mode="construction"
              renderGroupHeader={(groupKey: string, groupRows: any[]) => {
                // Check if all items in group have same currency
                const currencies = [...new Set(groupRows.map(item => item.currency_symbol))];
                const hasMixedCurrencies = currencies.length > 1;
                
                if (currencyView === 'discriminado' && hasMixedCurrencies) {
                  // Don't show totals for mixed currencies in discriminado mode
                  return (
                    <>
                      <div className="col-span-1 truncate">{groupKey}</div>
                      <div className="col-span-1 text-muted-foreground">-</div>
                      <div className="col-span-1 text-muted-foreground">-</div>
                    </>
                  );
                }
                
                // Calculate totals (safe for same currency or converted currencies)
                const totalAmount = groupRows.reduce((sum, item) => sum + item.amount, 0);
                const totalPercentage = groupRows.reduce((sum, item) => sum + parseFloat(item.percentage), 0).toFixed(2);
                const currencySymbol = groupRows[0]?.currency_symbol || 'ARS';
                
                return (
                  <>
                    <div className="col-span-1 truncate">{groupKey}</div>
                    <div className="col-span-1">{formatAmount(totalAmount, currencySymbol)}</div>
                    <div className="col-span-1">{totalPercentage}%</div>
                  </>
                );
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