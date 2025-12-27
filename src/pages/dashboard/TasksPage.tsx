import { useEffect } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';
import { ListTodo, Plus } from 'lucide-react';
import { TaskListView } from '@/features/tasks';

export default function TasksPage() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const handleNewTask = () => {
    openModal('task-multi', {
      projectId: selectedProjectId,
    });
  };

  const headerProps = {
    icon: ListTodo,
    title: "Tareas",
    actionButton: {
      icon: Plus,
      label: "Nueva Tarea",
      onClick: handleNewTask,
    },
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <TaskListView />
      </div>
    </Layout>
  );
}
