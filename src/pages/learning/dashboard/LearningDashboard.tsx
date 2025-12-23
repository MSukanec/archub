import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { LearningDashboardView } from '@/features/learning/views/LearningDashboardView'

export default function LearningDashboard() {
  return (
    <Layout hideHeader wide>
      <LearningDashboardView />
    </Layout>
  )
}
