import { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui-custom/Table';
import { Layout } from '@/components/layout/desktop/Layout';
import { useMaterialCategories, MaterialCategory } from '@/hooks/use-material-categories';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteMaterialCategory } from '@/hooks/use-material-categories';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ModalFactory } from '@/components/modal/form/ModalFactory';

export default function AdminMaterialCategories() {
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const { data: categories = [], isLoading } = useMaterialCategories();
  const { openModal } = useGlobalModalStore();
  const deleteMutation = useDeleteMaterialCategory();

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => 
      category.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleEdit = (category: MaterialCategory) => {
    openModal('material-category-form', { editingMaterialCategory: category })
  }

  const handleCreate = () => {
    openModal('material-category-form', { editingMaterialCategory: null })
  }

  const handleDelete = (category: MaterialCategory) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Categoría de Material',
      description: 'Esta acción eliminará permanentemente la categoría y no se puede deshacer.',
      itemName: category.name,
      destructiveActionText: 'Eliminar Categoría',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(category.id);
          toast({
            title: "Categoría eliminada",
            description: `La categoría "${category.name}" ha sido eliminada exitosamente.`,
          });
        } catch (error) {
          console.error('Error deleting category:', error);
          toast({
            title: "Error",
            description: "No se pudo eliminar la categoría de material.",
            variant: "destructive",
          });
        }
      },
      isLoading: deleteMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('');
    setSortBy('name');
  };

  // Statistics calculations
  const totalCategories = categories.length
  const recentCategories = categories.filter(cat => {
    const createdDate = new Date(cat.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate > weekAgo
  }).length;

  // Table columns configuration
  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '15%',
      render: (category: MaterialCategory) => (
        <span className="text-xs">
          {format(new Date(category.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Categoría',
      width: '70%',
      render: (category: MaterialCategory) => (
        <span className="text-sm font-medium">{category.name}</span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '15%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
            className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  const customFilters = (
    <div className="w-[288px] space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha de creación</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const headerProps = {
    title: 'Categorías de Materiales',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button 
        key="new-category"
        onClick={handleCreate}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Categoría
      </Button>
    ]
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Categorías</p>
                <p className="text-lg font-semibold">{totalCategories}</p>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nuevas (30 días)</p>
                <p className="text-lg font-semibold">{recentCategories}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Categorías Activas</p>
                <p className="text-lg font-semibold">{totalCategories}</p>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Más Utilizadas</p>
                <p className="text-lg font-semibold">{Math.ceil(totalCategories * 0.3)}</p>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Categories Table */}
        <Table
          data={filteredCategories}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay categorías</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay categorías de materiales que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>

      {/* Global Modal Factory */}
      <ModalFactory />
    </Layout>
  );
}