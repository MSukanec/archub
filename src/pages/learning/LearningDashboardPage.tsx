import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { LabLayout } from "@/layouts/lab/LabLayout"
import { useCurrentUser } from '@/hooks/use-current-user'
import { LearningDashboardView } from '@/features/learning/views/LearningDashboardView'
export default function LearningDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const layoutPreference = userData?.preferences?.layout || 'experimental'
  const isLabLayout = layoutPreference === 'lab'
  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        showSecondaryToolbar={false}
        organizationId={organizationId}
        showMembers={false}
      >
        <LearningDashboardView />
      </LabLayout>
    )
  }
  return (
    <Layout hideHeader wide>
      <LearningDashboardView />
    </Layout>
  )
}
