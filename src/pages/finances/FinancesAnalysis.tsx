import { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingDown, Calculator, PieChart, LayoutGrid, DollarSign, FileText } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMovements } from '@/hooks/use-movements'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { ExpensesSunburstChart } from '@/components/charts/ExpensesSunburstChart'
import { ExpensesTreemapChart } from '@/components/charts/ExpensesTreemapChart'
import { ExpensesSunburstRadialChart } from '@/components/charts/ExpensesSunburstRadialChart'

export default function FinancesAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado')
  const [activeTab, setActiveTab] = useState("analysis")
  
  const { data: userData } = useCurrentUser()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // Get movements data
  const { data: movements = [], isLoading } = useMovements(
    organizationId || '',
    projectId || ''
  )

  // Filter only expense movements (EGRESOS) by UUID and specific categories
  const allowedCategoryIds = [
    'd376d404-734a-47a9-b851-d112d64147db', // Mano de Obra
    'a8cab4bd-3d66-4022-a26d-4c208d0baccb', // Materiales
    'e854de08-da8f-4769-a2c5-b24b622f20b0'  // Indirectos
  ]
  
  const expenseMovements = movements.filter(movement => 
    movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7' && // EGRESOS
    allowedCategoryIds.includes(movement.category_id) // Only specified categories
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

  // Process data for pie chart - group by main categories
  const chartData = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    let totalAmount = 0

    // Group by category and sum amounts
    expenseMovements.forEach(movement => {
      const category = movement.movement_data?.category?.name || 'Sin categoría'
      const amount = Math.abs(movement.amount)
      
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount)
      totalAmount += amount
    })

    // Convert to chart format with specific colors for our 3 categories
    const colors = {
      'Mano de Obra': 'var(--chart-1)', // Verde
      'Materiales': 'var(--chart-5)',   // Rojo
      'Indirectos': 'var(--chart-4)'    // Amarillo
    }

    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0,
        color: colors[category as keyof typeof colors] || 'hsl(0, 0%, 50%)'
      }))
      .sort((a, b) => b.amount - a.amount) // Sort by amount descending
      .filter(item => item.amount > 0) // Only include positive amounts
  }, [expenseMovements])

  // Process data for sunburst chart - categories only (same as pie chart)
  const sunburstData = chartData

  // Process data for treemap chart - subcategories
  const treemapData = useMemo(() => {
    const categoryColors = {
      'Mano de Obra': 'var(--chart-1)', // Verde
      'Materiales': 'var(--chart-5)',   // Rojo
      'Indirectos': 'var(--chart-4)'    // Amarillo
    }

    // Generate color variations for subcategories within each category
    const getSubcategoryColor = (categoryColor: string, index: number, total: number) => {
      // For CSS variables, we need to get the computed color and vary it
      // Since we can't easily parse CSS variables, we'll use predefined variations
      const colorVariations = {
        'var(--chart-1)': [ // Mano de Obra (Verde)
          'hsl(110, 40%, 35%)',
          'hsl(110, 40%, 40%)', 
          'hsl(110, 40%, 45%)',
          'hsl(110, 40%, 50%)',
          'hsl(110, 40%, 55%)'
        ],
        'var(--chart-5)': [ // Materiales (Rojo)
          'hsl(0, 87%, 35%)',
          'hsl(0, 87%, 40%)',
          'hsl(0, 87%, 45%)',
          'hsl(0, 87%, 50%)',
          'hsl(0, 87%, 55%)'
        ],
        'var(--chart-4)': [ // Indirectos (Amarillo)
          'hsl(43, 74%, 35%)',
          'hsl(43, 74%, 40%)',
          'hsl(43, 74%, 45%)',
          'hsl(43, 74%, 50%)',
          'hsl(43, 74%, 55%)'
        ]
      }
      
      const variations = colorVariations[categoryColor as keyof typeof colorVariations]
      if (variations) {
        return variations[index % variations.length]
      }
      
      return categoryColor
    }

    // Group by category and subcategory
    const subcategoryMap = new Map<string, { category: string; amount: number }>()
    let totalAmount = 0
    
    expenseMovements.forEach(movement => {
      const category = movement.movement_data?.category?.name || 'Sin categoría'
      const subcategory = movement.movement_data?.subcategory?.name || 'Sin subcategoría'
      const amount = Math.abs(movement.amount)
      
      const key = `${category}-${subcategory}`
      const existing = subcategoryMap.get(key)
      
      if (existing) {
        existing.amount += amount
      } else {
        subcategoryMap.set(key, { category, amount })
      }
      
      totalAmount += amount
    })

    // Convert to treemap format with color variations
    const result: any[] = []
    const categoryGroups = new Map<string, Array<{ subcategory: string; amount: number }>>()
    
    // Group subcategories by category
    subcategoryMap.forEach((data, key) => {
      const [category, subcategory] = key.split('-')
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category)!.push({ subcategory, amount: data.amount })
    })

    // Generate treemap data with proper colors
    categoryGroups.forEach((subcategories, category) => {
      const categoryColor = categoryColors[category as keyof typeof categoryColors] || 'hsl(0, 0%, 50%)'
      
      // Sort subcategories by amount (largest first)
      subcategories.sort((a, b) => b.amount - a.amount)
      
      subcategories.forEach((sub, index) => {
        result.push({
          name: `${category} - ${sub.subcategory}`,
          size: sub.amount,
          category,
          subcategory: sub.subcategory,
          color: getSubcategoryColor(categoryColor, index, subcategories.length),
          percentage: totalAmount > 0 ? Number(((sub.amount / totalAmount) * 100).toFixed(1)) : 0
        })
      })
    })

    return result
      .filter(item => item.size > 0)
      .sort((a, b) => b.size - a.size) // Sort by size descending
  }, [expenseMovements])

  // Process data for radial sunburst chart - hierarchical structure
  const sunburstRadialData = useMemo(() => {
    const categoryGroups = new Map<string, Array<{ subcategory: string; amount: number; percentage: number }>>()
    let totalAmount = 0
    
    expenseMovements.forEach(movement => {
      const category = movement.movement_data?.category?.name || 'Sin categoría'
      const subcategory = movement.movement_data?.subcategory?.name || 'Sin subcategoría'
      const amount = Math.abs(movement.amount)
      
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      
      const existing = categoryGroups.get(category)!.find(item => item.subcategory === subcategory)
      if (existing) {
        existing.amount += amount
      } else {
        categoryGroups.get(category)!.push({ subcategory, amount, percentage: 0 })
      }
      
      totalAmount += amount
    })

    // Calculate percentages and convert to sunburst format
    const result: Array<{
      name: string
      children: Array<{ name: string; value: number; percentage: number }>
    }> = []

    categoryGroups.forEach((subcategories, category) => {
      const children = subcategories
        .map(sub => ({
          name: sub.subcategory,
          value: sub.amount,
          percentage: totalAmount > 0 ? Number(((sub.amount / totalAmount) * 100).toFixed(1)) : 0
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)

      if (children.length > 0) {
        result.push({
          name: category,
          children
        })
      }
    })

    return result.sort((a, b) => {
      const totalA = a.children.reduce((sum, child) => sum + child.value, 0)
      const totalB = b.children.reduce((sum, child) => sum + child.value, 0)
      return totalB - totalA
    })
  }, [expenseMovements])

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
      <div className="space-y-4">
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
          showGrouping={activeTab === "analysis"}
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
          tabs={[
            {
              value: "analysis",
              label: "Análisis por Subcategorías",
              icon: <FileText className="h-4 w-4" />
            },
            {
              value: "charts",
              label: "Gráficos",
              icon: <BarChart3 className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === "analysis" ? (
          // Tab Análisis por Subcategorías - Contenido actual
          filteredData.length > 0 ? (
            groupByCategory && groupedData ? (
              <Table
                columns={groupedColumns}
                data={filteredData}
                isLoading={isLoading}
                groupBy="category"
                mode="construction"
                renderGroupHeader={(groupKey: string, groupRows: any[]) => {
                  // Check if all items in group have same currency
                  const currencies = Array.from(new Set(groupRows.map(item => item.currency_symbol)));
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
          )
        ) : (
          // Tab Gráficos - Múltiples visualizaciones
          <div className="space-y-6">
            {/* Primera fila - Gráficos de categorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Egresos por Categorías
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribución de gastos por tipo de categoría
                  </p>
                </CardHeader>
                <CardContent className="pb-2">
                  <ExpensesByCategoryChart data={chartData || []} isLoading={isLoading} />
                </CardContent>
              </Card>
              
              {/* Sunburst Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    Vista Alternativa por Categorías
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribución de gastos por categorías principales
                  </p>
                </CardHeader>
                <CardContent className="pb-2">
                  <ExpensesSunburstChart data={sunburstData || []} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>

            {/* Segunda fila - Treemap de subcategorías */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Mapa de Subcategorías
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualización jerárquica de subcategorías con áreas proporcionales a los montos
                </p>
              </CardHeader>
              <CardContent className="pb-2">
                <ExpensesTreemapChart data={treemapData || []} isLoading={isLoading} />
              </CardContent>
            </Card>

            {/* Tercera fila - Sunburst Radial */}
            <Card>
              <CardContent className="p-6">
                <ExpensesSunburstRadialChart data={sunburstRadialData || []} isLoading={isLoading} />
              </CardContent>
            </Card>


          </div>
        )}
      </div>
    </Layout>
  )
}