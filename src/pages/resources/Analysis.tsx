import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, TableIcon, Users, Package, DollarSign, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AnalysisTasks from './analysis/AnalysisTasks'
import AnalysisLabor from './analysis/AnalysisLabor'
import AnalysisMaterials from './analysis/AnalysisMaterials'
import AnalysisOverheads from './analysis/AnalysisOverheads'

export default function Analysis() {
  const [activeTab, setActiveTab] = useState("tareas")

  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('resources')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "tareas",
      label: "Tareas",
      icon: <TableIcon className="h-4 w-4" />,
      isActive: activeTab === "tareas"
    },
    {
      id: "mano-obra",
      label: "Mano de Obra",
      icon: <Users className="h-4 w-4" />,
      isActive: activeTab === "mano-obra"
    },
    {
      id: "materiales",
      label: "Materiales",
      icon: <Package className="h-4 w-4" />,
      isActive: activeTab === "materiales"
    },
    {
      id: "indirectos",
      label: "Indirectos",
      icon: <DollarSign className="h-4 w-4" />,
      isActive: activeTab === "indirectos"
    }
  ]

  // Header configuration
  const headerProps = {
    title: "Análisis de Costos",
    icon: BarChart3,
    breadcrumb: [
      { name: "Construcción", href: "/construction" },
      { name: "Análisis de Costos", href: "/construction/cost-analysis" }
    ],
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    // Add action button based on active tab
    ...(activeTab === 'materiales' && {
      actionButton: {
        label: "Crear Material",
        icon: Plus,
        onClick: () => openModal('material-form', {}),
        variant: "default" as const
      }
    }),
    ...(activeTab === 'tareas' && {
      actionButton: {
        label: "Crear Tarea Personalizada",
        icon: Plus,
        onClick: () => openModal('parametric-task', {}),
        variant: "default" as const
      }
    })
  }

  return (
    <Layout headerProps={headerProps} wide>
      {/* Tab Content */}
      {activeTab === 'tareas' && <AnalysisTasks />}
      {activeTab === 'mano-obra' && <AnalysisLabor />}
      {activeTab === 'materiales' && <AnalysisMaterials />}
      {activeTab === 'indirectos' && <AnalysisOverheads />}
    </Layout>
  )
}