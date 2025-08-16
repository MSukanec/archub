import React, { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminMaterialProducts from './tabs/AdminMaterialProducts';
import AdminMaterialMaterials from './tabs/AdminMaterialMaterials';
import AdminMaterialBrands from './tabs/AdminMaterialBrands';
import AdminMaterialCategories from './tabs/AdminMaterialCategories';
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
          onClick: () => openModal('brand-form', { editingBrand: null })
        };
      case 'categorias':
        return {
          label: "Nueva Categoría",
          icon: Plus,
          onClick: () => openModal('task-category', { isEditing: true })
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
        return <AdminMaterialMaterials />;
      case 'marcas':
        return <AdminMaterialBrands />;
      case 'categorias':
        return <AdminMaterialCategories />;
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