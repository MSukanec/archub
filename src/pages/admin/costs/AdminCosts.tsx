import React, { useState } from 'react';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminCostProducts from './AdminCostProducts';
import AdminCostMaterials from './AdminCostMaterials';
import AdminCostBrands from './AdminCostBrands';
import AdminCostCategories from './AdminCostCategories';
import AdminCostPrices from './AdminCostPrices';
import AdminCostLabor from './AdminCostLabor';

const AdminCosts = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para refrescar precios promedio
  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_product_avg_prices');
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar todas las queries de productos para actualizar las tablas
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      
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
    { id: 'precios', label: 'Precios', isActive: activeTab === 'precios' },
    { id: 'labor', label: 'Mano de Obra', isActive: activeTab === 'labor' }
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
            variant: "ghost",
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
      case 'labor':
        return {
          label: "Nuevo Tipo de Mano de Obra",
          icon: Plus,
          onClick: () => openModal('labor-type-form', { editingLaborType: null })
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Costos",
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
        return <AdminCostProducts />;
      case 'materiales':
        return <AdminCostMaterials />;
      case 'marcas':
        return <AdminCostBrands />;
      case 'categorias':
        return <AdminCostCategories />;
      case 'precios':
        return <AdminCostPrices />;
      case 'labor':
        return <AdminCostLabor />;
      default:
        return <AdminCostProducts />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminCosts;