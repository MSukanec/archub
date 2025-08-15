import { useState } from 'react'
import { Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layout } from '@/components/layout/desktop/Layout'

export default function Subcontracts() {
  const [activeTab, setActiveTab] = useState('lista')

  return (
    <Layout
      headerProps={{
        icon: Package,
        pageTitle: "Subcontratos",
        tabs: [
          { id: 'lista', label: 'Lista', isActive: activeTab === 'lista' },
          { id: 'pagos', label: 'Pagos', isActive: activeTab === 'pagos' }
        ],
        onTabChange: setActiveTab
      }}
    >
      <div className="h-full">
        {activeTab === 'lista' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Contenido de Lista - Próximamente</p>
          </div>
        )}
        
        {activeTab === 'pagos' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Contenido de Pagos - Próximamente</p>
          </div>
        )}
      </div>
    </Layout>
  )
}