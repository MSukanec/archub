import React, { useState } from 'react';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminMaterialProducts from './AdminMaterialProducts';
import AdminMaterialMaterials from './AdminMaterialMaterials';
import AdminMaterialBrands from './AdminMaterialBrands';
import AdminMaterialCategories from './AdminMaterialCategories';
import AdminMaterialPrices from './AdminMaterialPrices';

const AdminMaterials = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();

  // Mutation para refrescar precios promedio
  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_product_avg_prices');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Precios actualizados",
        description: "Los precios promedio han sido actualizados correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error refreshing prices:', error);
      toast({
        title: "Error al actualizar precios",
        description: "No se pudieron actualizar los precios promedio.",
        variant: "destructive",
      });
    }
  });

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
          onClick: () => openModal('product-form', { editingProduct: null }),
          additionalButton: {
            label: "Refrescar",
            icon: RefreshCw,
            onClick: () => refreshPricesMutation.mutate(),
            variant: "secondary",
            isLoading: refreshPricesMutation.isPending
          }
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
          onClick: () => openModal('material-category-form', { editingMaterialCategory: null })
        };
      case 'precios':
        return {
          label: "Nuevo Precio",
          icon: Plus,
          onClick: () => {
            // TODO: Crear modal de creación de precios
            console.log('Crear nuevo precio');
          }
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
        return <AdminMaterialPrices />;
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