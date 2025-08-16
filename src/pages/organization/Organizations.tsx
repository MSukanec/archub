import { Layout } from '@/components/layout/desktop/Layout'
import { Building } from 'lucide-react'
import { OrganizationList } from './OrganizationList'

export default function Organizations() {
  const headerProps = {
    icon: Building,
    title: "Gestión de Organizaciones"
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <OrganizationList />
    </Layout>
  )
}