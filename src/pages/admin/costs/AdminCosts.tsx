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
import AdminCostLabor from './AdminCostLabor';

const AdminCosts = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para refrescar precios promedio y conteo de proveedores
  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      // Refrescar ambas vistas materializadas
      const { error: avgPricesError } = await supabase.rpc('refresh_product_avg_prices');
      if (avgPricesError) {
        console.error('Error refreshing material_avg_prices:', avgPricesError);
        throw new Error('Error al refrescar precios promedio');
      }

      // Refrescar la segunda vista materializada
      const { error: productCountError } = await supabase.rpc('refresh_materialized_view', { 
        view_name: 'provider_product_count' 
      });
      if (productCountError) {
        console.error('Error refreshing provider_product_count:', productCountError);
        throw new Error('Error al refrescar conteo de productos por proveedor');
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries de productos para actualizar las tablas
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      
      toast({
        title: "Datos actualizados",
        description: "Los precios promedio y conteo de proveedores han sido actualizados correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error refreshing prices:', error);
      toast({
        title: "Error al actualizar datos",
        description: "No se pudieron actualizar los datos de las vistas materializadas.",
        variant: "destructive",
      });
    }
  });

  const tabs = [
    { id: 'productos', label: 'Productos', isActive: activeTab === 'productos' },
    { id: 'materiales', label: 'Materiales', isActive: activeTab === 'materiales' },
    { id: 'marcas', label: 'Marcas', isActive: activeTab === 'marcas' },
    { id: 'categorias', label: 'Categorías', isActive: activeTab === 'categorias' },
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