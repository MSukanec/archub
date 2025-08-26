import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Users } from 'lucide-react'
import LaborList from './LaborList'

export default function Labor() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header configuration
  const headerProps = {
    title: "Análisis de Mano de Obra",
    icon: Users
  }

  return (
    <Layout headerProps={headerProps} wide>
      <LaborList />
    </Layout>
  )
}