import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  TrendLineChart,
  MultiLineChart,
  SparklineChart,
  VerticalBarChart,
  HorizontalBarChart,
  GroupedBarChart,
  SegmentedBarChart,
  DonutChart,
  ProgressRingChart,
  ComposedBarLineChart,
  FinancialFlowChart,
  BalanceTimelineChart,
  HeatmapGrid
} from '@/components/charts'

const MOCK_LINE_DATA = [
  { label: 'Ene', value: 4000 },
  { label: 'Feb', value: 3000 },
  { label: 'Mar', value: 5000 },
  { label: 'Abr', value: 4500 },
  { label: 'May', value: 6000 },
  { label: 'Jun', value: 5500 }
]

const MOCK_MULTI_LINE_DATA = [
  { label: 'Ene', ingresos: 4000, gastos: 2400 },
  { label: 'Feb', ingresos: 3000, gastos: 1398 },
  { label: 'Mar', ingresos: 5000, gastos: 3800 },
  { label: 'Abr', ingresos: 4500, gastos: 3908 },
  { label: 'May', ingresos: 6000, gastos: 4800 },
  { label: 'Jun', ingresos: 5500, gastos: 3800 }
]

const MOCK_SPARKLINE_DATA = [
  { value: 10 }, { value: 15 }, { value: 8 }, { value: 22 }, 
  { value: 18 }, { value: 25 }, { value: 20 }, { value: 30 }
]

const MOCK_BAR_DATA = [
  { label: 'Producto A', value: 4000 },
  { label: 'Producto B', value: 3000 },
  { label: 'Producto C', value: 2000 },
  { label: 'Producto D', value: 2780 },
  { label: 'Producto E', value: 1890 }
]

const MOCK_HORIZONTAL_BAR_DATA = [
  { label: 'Marketing', value: 4000, color: 'var(--chart-1)' },
  { label: 'Ventas', value: 3000, color: 'var(--chart-2)' },
  { label: 'Desarrollo', value: 2000, color: 'var(--chart-3)' },
  { label: 'Soporte', value: 2780, color: 'var(--chart-4)' }
]

const MOCK_GROUPED_BAR_DATA = [
  { label: 'Q1', actual: 4000, proyectado: 4500 },
  { label: 'Q2', actual: 3000, proyectado: 3200 },
  { label: 'Q3', actual: 5000, proyectado: 4800 },
  { label: 'Q4', actual: 4500, proyectado: 5000 }
]

const MOCK_DONUT_DATA = [
  { label: 'Materiales', value: 400, color: 'var(--chart-1)' },
  { label: 'Mano de Obra', value: 300, color: 'var(--chart-2)' },
  { label: 'Equipos', value: 200, color: 'var(--chart-3)' },
  { label: 'Otros', value: 100, color: 'var(--chart-4)' }
]

const MOCK_COMPOSED_DATA = [
  { label: 'Ene', barValue: 4000, lineValue: 2400 },
  { label: 'Feb', barValue: 3000, lineValue: 1398 },
  { label: 'Mar', barValue: 5000, lineValue: 9800 },
  { label: 'Abr', barValue: 4780, lineValue: 3908 },
  { label: 'May', barValue: 5890, lineValue: 4800 },
  { label: 'Jun', barValue: 4390, lineValue: 3800 }
]

const MOCK_HEATMAP_DATA = [
  { label: 'Lun 9am', value: 50 },
  { label: 'Lun 12pm', value: 80 },
  { label: 'Lun 3pm', value: 30 },
  { label: 'Mar 9am', value: 70 },
  { label: 'Mar 12pm', value: 40 },
  { label: 'Mar 3pm', value: 90 },
  { label: 'Mie 9am', value: 20 },
  { label: 'Mie 12pm', value: 60 },
  { label: 'Mie 3pm', value: 50 },
  { label: 'Jue 9am', value: 80 },
  { label: 'Jue 12pm', value: 30 },
  { label: 'Jue 3pm', value: 70 }
]

const MOCK_SEGMENTED_BAR_DATA = [
  { label: 'Materiales', value: 45000 },
  { label: 'Mano de Obra', value: 32000 },
  { label: 'Equipos', value: 18000 },
  { label: 'Otros', value: 5000 }
]

const MOCK_FINANCIAL_FLOW_DATA = [
  { label: 'Ene', inflow: 50000, outflow: 35000, net: 15000 },
  { label: 'Feb', inflow: 45000, outflow: 40000, net: 5000 },
  { label: 'Mar', inflow: 60000, outflow: 38000, net: 22000 },
  { label: 'Abr', inflow: 55000, outflow: 42000, net: 13000 },
  { label: 'May', inflow: 70000, outflow: 50000, net: 20000 },
  { label: 'Jun', inflow: 65000, outflow: 45000, net: 20000 }
]

const MOCK_BALANCE_TIMELINE_DATA = [
  { label: '1 Ene', displayLabel: '1', dailyBalance: 5000, cumulativeBalance: 5000 },
  { label: '8 Ene', displayLabel: '8', dailyBalance: -2000, cumulativeBalance: 3000 },
  { label: '15 Ene', displayLabel: '15', dailyBalance: 8000, cumulativeBalance: 11000 },
  { label: '22 Ene', displayLabel: '22', dailyBalance: -3000, cumulativeBalance: 8000 },
  { label: '29 Ene', displayLabel: '29', dailyBalance: 6000, cumulativeBalance: 14000 }
]

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

const ChartCard = ({ title, children }: ChartCardProps) => (
  <Card className="overflow-hidden" data-testid={`chart-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0 overflow-x-auto">
      {children}
    </CardContent>
  </Card>
)

interface ChartGroupProps {
  title: string
  children: React.ReactNode
}

const ChartGroup = ({ title, children }: ChartGroupProps) => (
  <Card className="col-span-2 overflow-hidden" data-testid={`chart-group-${title.toLowerCase()}`}>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 overflow-x-hidden">
        {children}
      </div>
    </CardContent>
  </Card>
)

const ChartGalleryView = () => {
  return (
    <div className="space-y-6 overflow-x-hidden" data-testid="chart-gallery-view">
      <div className="grid grid-cols-2 gap-6 overflow-x-hidden">
        
        <ChartGroup title="LINE">
          <ChartCard title="TrendLineChart">
            <div className="h-48 overflow-hidden">
              <TrendLineChart data={MOCK_LINE_DATA} height={180} />
            </div>
          </ChartCard>
          <ChartCard title="MultiLineChart">
            <div className="h-48 overflow-hidden">
              <MultiLineChart 
                data={MOCK_MULTI_LINE_DATA} 
                series={[
                  { key: 'ingresos', color: 'var(--chart-1)', name: 'Ingresos' },
                  { key: 'gastos', color: 'var(--chart-2)', name: 'Gastos' }
                ]}
                height={180}
              />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="SPARKLINE">
          <ChartCard title="SparklineChart">
            <div className="h-48 flex items-center justify-center overflow-hidden">
              <SparklineChart data={MOCK_SPARKLINE_DATA} height={60} color="var(--chart-1)" />
            </div>
          </ChartCard>
          <ChartCard title="SparklineChart (Colors)">
            <div className="h-48 flex items-center justify-center overflow-hidden">
              <SparklineChart data={MOCK_SPARKLINE_DATA} height={60} color="var(--chart-2)" />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="BAR">
          <ChartCard title="VerticalBarChart">
            <div className="h-48 overflow-hidden">
              <VerticalBarChart data={MOCK_BAR_DATA} height={180} />
            </div>
          </ChartCard>
          <ChartCard title="HorizontalBarChart">
            <div className="h-48 overflow-hidden">
              <HorizontalBarChart data={MOCK_HORIZONTAL_BAR_DATA} height={180} />
            </div>
          </ChartCard>
          <ChartCard title="GroupedBarChart">
            <div className="h-48 overflow-hidden">
              <GroupedBarChart 
                data={MOCK_GROUPED_BAR_DATA}
                series={[
                  { key: 'actual', color: 'var(--chart-1)', name: 'Actual' },
                  { key: 'proyectado', color: 'var(--chart-3)', name: 'Proyectado' }
                ]}
                height={180}
              />
            </div>
          </ChartCard>
          <ChartCard title="SegmentedBarChart">
            <div className="h-48 overflow-hidden">
              <SegmentedBarChart 
                data={MOCK_SEGMENTED_BAR_DATA}
                height={180}
              />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="PIE">
          <ChartCard title="DonutChart">
            <div className="h-48 overflow-hidden">
              <DonutChart data={MOCK_DONUT_DATA} height={180} />
            </div>
          </ChartCard>
          <ChartCard title="DonutChart (sin legend)">
            <div className="h-48 overflow-hidden">
              <DonutChart 
                data={MOCK_DONUT_DATA} 
                height={180}
                showLegend={false}
              />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="RADIAL">
          <ChartCard title="ProgressRingChart">
            <div className="h-48 flex items-center justify-center overflow-hidden">
              <ProgressRingChart value={75} height={160} />
            </div>
          </ChartCard>
          <ChartCard title="ProgressRingChart (con label)">
            <div className="h-48 flex items-center justify-center overflow-hidden">
              <ProgressRingChart value={42} height={160} label="Completado" showPercentage />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="COMPOSED">
          <ChartCard title="ComposedBarLineChart">
            <div className="h-48 overflow-hidden">
              <ComposedBarLineChart 
                data={MOCK_COMPOSED_DATA}
                barName="Ventas"
                lineName="Tendencia"
                height={180}
              />
            </div>
          </ChartCard>
          <ChartCard title="FinancialFlowChart">
            <div className="h-48 overflow-hidden">
              <FinancialFlowChart 
                data={MOCK_FINANCIAL_FLOW_DATA}
                height={180}
                inflowLabel="Ingresos"
                outflowLabel="Egresos"
                netLabel="Neto"
              />
            </div>
          </ChartCard>
          <ChartCard title="BalanceTimelineChart">
            <div className="h-48 overflow-hidden">
              <BalanceTimelineChart 
                data={MOCK_BALANCE_TIMELINE_DATA}
                height={180}
              />
            </div>
          </ChartCard>
        </ChartGroup>

        <ChartGroup title="HEATMAP">
          <ChartCard title="HeatmapGrid">
            <div className="h-48 overflow-hidden">
              <HeatmapGrid 
                data={MOCK_HEATMAP_DATA}
                columns={4}
              />
            </div>
          </ChartCard>
        </ChartGroup>

      </div>
    </div>
  )
}

export default ChartGalleryView
