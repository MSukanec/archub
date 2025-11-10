import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminTaskList from './AdminTaskList';
import AdminTaskCategories from './AdminTaskCategories';
import AdminTaskDivisions from './AdminTaskDivisions';
import AdminTaskParameters from './AdminTaskParameters';
import AdminActionsList from './AdminActionsList';

const AdminTasks = () => {
  const [activeTab, setActiveTab] = useState('tareas');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'tareas', label: 'Tareas', isActive: activeTab === 'tareas' },
    { id: 'parametros', label: 'Parámetros', isActive: activeTab === 'parametros' },
    { id: 'categorias', label: 'Categorías', isActive: activeTab === 'categorias' },
    { id: 'divisiones', label: 'Rubros', isActive: activeTab === 'divisiones' },
    { id: 'acciones', label: 'Acciones', isActive: activeTab === 'acciones' }
  ];

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

  const renderTabContent = () => {
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
        {renderTabContent()}
      </div>
    </Layout>
  );
};

export default AdminTasks;