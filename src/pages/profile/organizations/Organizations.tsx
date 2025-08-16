import { Layout } from '@/components/layout/desktop/Layout'
import { useState } from 'react'
import { Building } from 'lucide-react'
import { OrganizationList } from './OrganizationList'
import { OrganizationBasicData } from './OrganizationBasicData'

export default function Organizations() {
  const [activeTab, setActiveTab] = useState('lista')

  const tabs = [
    {
      id: 'lista',
      label: 'Lista de Organizaciones',
      isActive: activeTab === 'lista'
    },
    {
      id: 'datos-basicos',
      label: 'Datos Básicos',
      isActive: activeTab === 'datos-basicos'
    }
  ]

  const headerProps = {
    icon: Building,
    title: "Gestión de Organizaciones",
    tabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {activeTab === 'lista' && <OrganizationList />}
      {activeTab === 'datos-basicos' && <OrganizationBasicData />}
    </Layout>
  )
}