import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useCurrentUser } from '@/hooks/use-current-user';
import { CourseListView } from '@/features/learning/views/CourseListView';
import { BookOpen } from 'lucide-react';

export default function CourseList() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
    organizationId,
    showMembers: false,
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={false}
      >
        <CourseListView />
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <CourseListView />
    </Layout>
  );
}
