import { useState } from 'react';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useGlobalModalStore } from '@/components/modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import AdminCostProducts from './AdminCostProducts';
import AdminCostMaterials from './AdminCostMaterials';
import AdminCostBrands from './AdminCostBrands';
import AdminCostCategories from './AdminCostCategories';
import AdminCostLabor from './AdminCostLabor';

const COSTS_TABS = [
  { id: 'productos', label: 'Productos' },
  { id: 'materiales', label: 'Materiales' },
  { id: 'marcas', label: 'Marcas' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'labor', label: 'Mano de Obra' }
];

const AdminCosts = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('Refrescando vista product_avg_prices...');
        const { error: productAvgError } = await supabase.rpc('refresh_product_avg_prices');
        if (productAvgError) {
          console.error('Error refreshing product_avg_prices:', productAvgError);
          throw new Error(`Error al refrescar precios de productos: ${productAvgError.message}`);
        }
        console.log('Vista product_avg_prices refrescada exitosamente');

        console.log('Refrescando vista material_avg_prices...');
        const { error: materialAvgError } = await supabase.rpc('refresh_material_avg_prices');
        if (materialAvgError) {
          console.error('Error refreshing material_avg_prices:', materialAvgError);
          throw new Error(`Error al refrescar precios de materiales: ${materialAvgError.message}`);
        }
        console.log('Vista material_avg_prices refrescada exitosamente');

        console.log('Refrescando vista labor_avg_prices...');
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      queryClient.invalidateQueries({ queryKey: ['labor-view'] });
      queryClient.invalidateQueries({ queryKey: ['labor-price'] });
      queryClient.invalidateQueries({ queryKey: ['task-labor'] });
      queryClient.invalidateQueries({ queryKey: ['task-costs'] });
      queryClient.invalidateQueries({ queryKey: ['task-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-view'] });
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      
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

  const renderView = () => {
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

  const handleCreate = () => {
    switch (activeTab) {
      case 'productos':
        openModal('product-form', { editingProduct: null });
        break;
      case 'materiales':
        openModal('material-form', { editingMaterial: null });
        break;
      case 'marcas':
        openModal('brand-form', { editingBrand: null });
        break;
      case 'categorias':
        openModal('material-category-form', { editingMaterialCategory: null });
        break;
      case 'labor':
        openModal('labor-type-form', { editingLaborType: null });
        break;
    }
  };

  const getCreateLabel = () => {
    switch (activeTab) {
      case 'productos': return 'Nuevo Producto';
      case 'materiales': return 'Nuevo Material';
      case 'marcas': return 'Nueva Marca';
      case 'categorias': return 'Nueva Categoría';
      case 'labor': return 'Nuevo Tipo de Mano de Obra';
      default: return 'Nuevo';
    }
  };

  const showRefreshButton = activeTab === 'productos' || activeTab === 'labor';

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {showRefreshButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshPricesMutation.mutate()}
          disabled={refreshPricesMutation.isPending}
          data-testid="button-refresh-prices"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshPricesMutation.isPending ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      )}
      <Button
        size="sm"
        onClick={handleCreate}
        data-testid="button-create-cost-item"
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
        tabs={COSTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        {renderView()}
      </LabLayout>
    );
  }

  const tabs = COSTS_TABS.map(tab => ({
    ...tab,
    isActive: activeTab === tab.id
  }));

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
            variant: "ghost" as const,
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
            variant: "ghost" as const,
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

  return (
    <Layout wide headerProps={headerProps}>
      {renderView()}
    </Layout>
  );
};

export default AdminCosts;
