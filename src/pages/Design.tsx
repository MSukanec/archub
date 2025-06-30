import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { DesignGantt } from '@/components/ui-custom/design/DesignGantt';
import { DesignTaskModal } from '@/components/ui-custom/design/DesignTaskModal';

export default function Design() {
  const [searchValue, setSearchValue] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { data: userData } = useCurrentUser();

  const currentProject = userData?.organization?.name || "Proyecto sin seleccionar";

  const handleNewTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const headerProps = {
    title: `Diseño - ${currentProject}`,
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    onClearFilters: () => setSearchValue(""),
    actions: [
      <Button 
        key="new-task"
        className="h-8 px-3 text-sm"
        onClick={handleNewTask}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Tarea
      </Button>
    ]
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="flex-1 overflow-hidden">
        <DesignGantt 
          searchValue={searchValue}
          onTaskClick={handleEditTask}
        />
      </div>
      
      {showTaskModal && (
        <DesignTaskModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            // Refresh data
          }}
        />
      )}
    </Layout>
  );
}