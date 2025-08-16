import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminTaskList from './AdminTaskList';
import AdminTaskCategories from './AdminTaskCategories';
import AdminTaskParameters from './AdminTaskParameters';
import AdminTaskTemplates from './AdminTaskTemplates';

const AdminTasks = () => {
  const [activeTab, setActiveTab] = useState('tareas');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'tareas', label: 'Tareas' },
    { id: 'categorias', label: 'Categorías' },
    { id: 'parametros', label: 'Parámetros' },
    { id: 'plantillas', label: 'Plantillas' }
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
          onClick: () => {
            // TODO: Crear modal de creación de categorías
            console.log('Crear nueva categoría');
          }
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
      case 'plantillas':
        return {
          label: "Nueva Plantilla",
          icon: Plus,
          onClick: () => {
            // TODO: Crear modal de creación de plantillas
            console.log('Crear nueva plantilla');
          }
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
      case 'plantillas':
        return <AdminTaskTemplates />;
      default:
        return <AdminTaskList />;
    }
  };

  const headerProps = {
    title: 'Tareas',
    icon: ListTodo,
    tabs,
    activeTab,
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