import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useGlobalModalStore } from '@/components/modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import AdminTaskList from './AdminTaskList';
import AdminTaskCategories from './AdminTaskCategories';
import AdminTaskDivisions from './AdminTaskDivisions';
import AdminTaskParameters from './AdminTaskParameters';
import AdminActionsList from './AdminActionsList';

const TASKS_TABS = [
  { id: 'tareas', label: 'Tareas' },
  { id: 'parametros', label: 'Parámetros' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'divisiones', label: 'Rubros' },
  { id: 'acciones', label: 'Acciones' }
];

const AdminTasks = () => {
  const [activeTab, setActiveTab] = useState('tareas');
  const { openModal } = useGlobalModalStore();
  const { data: userData } = useCurrentUser();

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const renderView = () => {
    switch (activeTab) {
      case 'tareas':
        return <AdminTaskList />;
      case 'categorias':
        return <AdminTaskCategories />;
      case 'divisiones':
        return <AdminTaskDivisions />;
      case 'parametros':
        return <AdminTaskParameters />;
      case 'acciones':
        return <AdminActionsList />;
      default:
        return <AdminTaskList />;
    }
  };

  const handleCreate = () => {
    switch (activeTab) {
      case 'tareas':
        console.log('Nueva tarea - funcionalidad pendiente');
        break;
      case 'categorias':
        openModal('task-category', { isEditing: true });
        break;
      case 'divisiones':
        openModal('task-division', { isEditing: true });
        break;
      case 'parametros':
        openModal('task-parameter');
        break;
      case 'acciones':
        console.log('Nueva acción - modal pendiente');
        break;
    }
  };

  const getCreateLabel = () => {
    switch (activeTab) {
      case 'tareas': return 'Nueva Tarea';
      case 'categorias': return 'Nueva Categoría';
      case 'divisiones': return 'Nuevo Rubro';
      case 'parametros': return 'Nuevo Parámetro';
      case 'acciones': return 'Nueva Acción';
      default: return 'Nuevo';
    }
  };

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        onClick={handleCreate}
        data-testid="button-create-task-item"
      >
        <Plus className="w-4 h-4 mr-2" />
        {getCreateLabel()}
      </Button>
    </div>
  );

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true}
        tabs={TASKS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        <div className="space-y-6">
          {renderView()}
        </div>
      </LabLayout>
    );
  }

  const tabs = TASKS_TABS.map(tab => ({
    ...tab,
    isActive: activeTab === tab.id
  }));

  const getActionButton = () => {
    switch (activeTab) {
      case 'tareas':
        return {
          label: "Nueva Tarea",
          icon: Plus,
          onClick: () => console.log('Nueva tarea - funcionalidad pendiente')
        };
      case 'categorias':
        return {
          label: "Nueva Categoría",
          icon: Plus,
          onClick: () => openModal('task-category', { isEditing: true })
        };
      case 'divisiones':
        return {
          label: "Nuevo Rubro",
          icon: Plus,
          onClick: () => openModal('task-division', { isEditing: true })
        };
      case 'parametros':
        return {
          label: "Nuevo Parámetro",
          icon: Plus,
          onClick: () => openModal('task-parameter')
        };
      case 'acciones':
        return {
          label: "Nueva Acción",
          icon: Plus,
          onClick: () => console.log('Nueva acción - modal pendiente')
        };
      default:
        return {
          label: "Nueva Tarea",
          icon: Plus,
          onClick: () => console.log('Crear nueva tarea')
        };
    }
  };

  const headerProps = {
    title: 'Tareas',
    icon: ListTodo,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {renderView()}
      </div>
    </Layout>
  );
};

export default AdminTasks;
