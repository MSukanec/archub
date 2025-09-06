import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/desktop/PageLayout'
import CostAnalysisTasks from './CostAnalysisTasks'
import CostAnalysisMaterials from './CostAnalysisMaterials'
import CostAnalysisLabor from './CostAnalysisLabor'
import CostAnalysisIndirects from './CostAnalysisIndirects'

export default function CostAnalysis() {
  const [activeTab, setActiveTab] = useState('tasks')

  const tabs = [
    { id: 'tasks', label: 'Tareas', icon: '📋' },
    { id: 'materials', label: 'Materiales', icon: '🧱' },
    { id: 'labor', label: 'Mano de Obra', icon: '👷' },
    { id: 'indirects', label: 'Gastos Indirectos', icon: '📊' }
  ]

  return (
    <PageLayout title="Análisis de Costos" showBackButton={false}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <CostAnalysisTasks />
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-4">
            <CostAnalysisMaterials />
          </TabsContent>
          
          <TabsContent value="labor" className="space-y-4">
            <CostAnalysisLabor />
          </TabsContent>
          
          <TabsContent value="indirects" className="space-y-4">
            <CostAnalysisIndirects />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}