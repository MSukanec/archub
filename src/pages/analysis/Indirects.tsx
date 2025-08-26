import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { DollarSign } from 'lucide-react'
import IndirectList from './IndirectList'

export default function Indirects() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header configuration
  const headerProps = {
    title: "Análisis de Costos Indirectos",
    icon: DollarSign
  }

  return (
    <Layout headerProps={headerProps} wide>
      <IndirectList />
    </Layout>
  )
}