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

  // Mutation para refrescar vistas materializadas
  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('Refrescando vista product_avg_prices...');
        // Refrescar primera vista materializada (precios promedio de productos)
        const { error: productAvgError } = await supabase.rpc('refresh_product_avg_prices');
        if (productAvgError) {
          console.error('Error refreshing product_avg_prices:', productAvgError);
          throw new Error(`Error al refrescar precios de productos: ${productAvgError.message}`);
        }
        console.log('Vista product_avg_prices refrescada exitosamente');

        console.log('Refrescando vista material_avg_prices...');
        // Refrescar segunda vista materializada (precios promedio de materiales)
        const { error: materialAvgError } = await supabase.rpc('refresh_material_avg_prices');
        if (materialAvgError) {
          console.error('Error refreshing material_avg_prices:', materialAvgError);
          throw new Error(`Error al refrescar precios de materiales: ${materialAvgError.message}`);
        }
        console.log('Vista material_avg_prices refrescada exitosamente');

        console.log('Refrescando vista labor_avg_prices...');
        // Refrescar tercera vista materializada (precios promedio de mano de obra)
        const { error: laborAvgError } = await supabase.rpc('refresh_labor_avg_prices');
        if (laborAvgError) {
          console.error('Error refreshing labor_avg_prices:', laborAvgError);
          throw new Error(`Error al refrescar precios de mano de obra: ${laborAvgError.message}`);
        }
        console.log('Vista labor_avg_prices refrescada exitosamente');
      } catch (error: any) {
        console.error('Error general al refrescar vistas:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries de productos, materiales y mano de obra para actualizar las tablas
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      queryClient.invalidateQueries({ queryKey: ['labor-view'] }); // Actualizado para usar labor-view
      queryClient.invalidateQueries({ queryKey: ['labor-price'] });
      queryClient.invalidateQueries({ queryKey: ['task-labor'] }); // Invalidar cache de task-labor para que se actualicen los precios en popovers
      
      // CRITICAL: Invalidar queries de tareas para que reflejen los nuevos precios
      queryClient.invalidateQueries({ queryKey: ['task-costs'] }); // Para TaskCostsView y popovers
      queryClient.invalidateQueries({ queryKey: ['task-materials'] }); // Para materiales de tareas
      queryClient.invalidateQueries({ queryKey: ['materials'] }); // Query general de materiales
      queryClient.invalidateQueries({ queryKey: ['material-view'] }); // Vista de materiales
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] }); // Lista de tareas generadas
      queryClient.invalidateQueries({ queryKey: ['task-library'] }); // Biblioteca de tareas
      
      toast({
        title: "Datos actualizados",
        description: "Los precios promedio de productos, materiales y mano de obra han sido actualizados correctamente.",
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
          onClick: () => openModal('labor-type-form', { editingLaborType: null }),
          additionalButton: {
            label: "Refrescar",
            icon: RefreshCw,
            onClick: () => refreshPricesMutation.mutate(),
            variant: "ghost",
            isLoading: refreshPricesMutation.isPending
          }
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