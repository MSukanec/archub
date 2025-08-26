import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Package, Plus } from 'lucide-react'
import MaterialList from './MaterialList'

export default function Materials() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header configuration
  const headerProps = {
    title: "Análisis de Materiales",
    icon: Package,
    actionButton: {
      label: "Nuevo Producto Personalizado",
      icon: Plus,
      onClick: () => {
        // TODO: Implementar modal para producto personalizado
        console.log('Crear nuevo producto personalizado')
      },
      variant: "default" as const
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      <MaterialList />
    </Layout>
  )
}