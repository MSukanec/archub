import React, { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminMaterialProducts from './tabs/AdminMaterialProducts';
import AdminMaterialMateriales from './tabs/AdminMaterialMateriales';
import AdminMaterialMarcas from './tabs/AdminMaterialMarcas';
import AdminMaterialCategorias from './tabs/AdminMaterialCategorias';
import AdminMaterialPrecios from './tabs/AdminMaterialPrecios';

const AdminMaterials = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'productos', label: 'Productos', isActive: activeTab === 'productos' },
    { id: 'materiales', label: 'Materiales', isActive: activeTab === 'materiales' },
    { id: 'marcas', label: 'Marcas', isActive: activeTab === 'marcas' },
    { id: 'categorias', label: 'Categorías', isActive: activeTab === 'categorias' },
    { id: 'precios', label: 'Precios', isActive: activeTab === 'precios' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'productos':
        return {
          label: "Nuevo Producto",
          icon: Plus,
          onClick: () => openModal('product-form', { editingProduct: null })
        };
      case 'materiales':
        return {
          label: "Nuevo Material",
          icon: Plus,
          onClick: () => openModal('material-form', { editingMaterial: null })
        };
      case 'marcas':
        return {
          label: "Nueva Marca",
          icon: Plus,
          onClick: () => openModal('admin-brand', { isEditing: false })
        };
      case 'categorias':
        return {
          label: "Nueva Categoría",
          icon: Plus,
          onClick: () => openModal('admin-material-category', { isEditing: false })
        };
      case 'precios':
        return {
          label: "Nuevo Precio",
          icon: Plus,
          onClick: () => openModal('admin-material-price', { isEditing: false })
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Materiales",
    icon: Package,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return <AdminMaterialProducts />;
      case 'materiales':
        return <AdminMaterialMateriales />;
      case 'marcas':
        return <AdminMaterialMarcas />;
      case 'categorias':
        return <AdminMaterialCategorias />;
      case 'precios':
        return <AdminMaterialPrecios />;
      default:
        return <AdminMaterialProducts />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminMaterials;