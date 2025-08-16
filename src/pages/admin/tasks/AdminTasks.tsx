import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminTaskList from './AdminTaskList';
import AdminTaskCategories from './AdminTaskCategories';
import AdminTaskParameters from './AdminTaskParameters';
import AdminTaskTemplates from './AdminTaskTemplates';
import AdminTaskFlow from './AdminTaskFlow';

const AdminTasks = () => {
  const [activeTab, setActiveTab] = useState('tareas');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'tareas', label: 'Tareas', isActive: activeTab === 'tareas' },
    { id: 'parametros', label: 'Parámetros', isActive: activeTab === 'parametros' },
    { id: 'flujo', label: 'Flujo', isActive: activeTab === 'flujo' },
    { id: 'categorias', label: 'Categorías', isActive: activeTab === 'categorias' },
    { id: 'plantillas', label: 'Plantillas', isActive: activeTab === 'plantillas' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'tareas':
        return {
          label: "Nueva Tarea",
          icon: Plus,
          onClick: () => openModal('parametric-task')
        };
      case 'categorias':
        return {
          label: "Nueva Categoría",
          icon: Plus,
          onClick: () => openModal('task-category', { isEditing: true })
        };
      case 'parametros':
        return {
          label: "Nuevo Parámetro",
          icon: Plus,
          onClick: () => {
            // TODO: Crear modal de creación de parámetros
            console.log('Crear nuevo parámetro');
          }
        };
      case 'flujo':
        return undefined; // No action button for flow tab
      case 'plantillas':
        return {
          label: "Nueva Plantilla",
          icon: Plus,
          onClick: () => openModal('task-template')
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
      case 'parametros':
        return <AdminTaskParameters />;
      case 'flujo':
        return <AdminTaskFlow />;
      case 'plantillas':
        return <AdminTaskTemplates />;
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