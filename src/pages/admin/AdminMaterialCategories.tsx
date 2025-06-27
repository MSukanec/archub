import { useState } from 'react';
import { useMaterialCategories, useDeleteMaterialCategory, MaterialCategory } from '@/hooks/use-material-categories';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, Edit, Trash2, Filter, Tag, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NewAdminMaterialCategoryModal } from '@/modals/NewAdminMaterialCategoryModal';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminMaterialCategories() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | undefined>();
  const [deleteCategory, setDeleteCategory] = useState<MaterialCategory | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const { data: categories = [], isLoading } = useMaterialCategories();
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
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    
    try {
      await deleteMutation.mutateAsync(deleteCategory.id);
      toast({
        title: "Categoría eliminada",
        description: "La categoría de material ha sido eliminada exitosamente.",
      });
      setDeleteCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría de material.",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setSortBy('date');
  };

  // Calculate statistics
  const totalCategories = categories.length;
  const recentCategories = categories.filter(cat => {
    const categoryDate = new Date(cat.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return categoryDate >= thirtyDaysAgo;
  }).length;

  // Table columns configuration
  const columns = [
    {
      key: 'created_at' as keyof MaterialCategory,
      title: 'Fecha de Creación',
      width: '5%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--menues-fg)]" />
          <span className="text-xs">
            {format(new Date(category.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      )
    },
    {
      key: 'name' as keyof MaterialCategory,
      title: 'Categoría',
      width: '90%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-sm">{category.name}</div>
          </div>
        </div>
      )
    },
    {
      key: 'actions' as keyof MaterialCategory,
      title: 'Acciones',
      width: '5%',
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
            onClick={() => setDeleteCategory(category)}
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

  return (
    <Layout
      wide
      headerProps={{
        title: "Categorías de Materiales",
        showSearch: true,
        searchValue,
        onSearchChange: setSearchValue,
        customFilters,
        onClearFilters: handleClearFilters,
        actions: [
          <Button key="new" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        ]
      }}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
              <Tag className="h-4 w-4 text-[var(--menues-fg)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevas (30 días)</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
              <Tag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Más Utilizadas</CardTitle>
              <Tag className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.ceil(totalCategories * 0.3)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <CustomTable
          data={filteredCategories}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No se encontraron categorías de materiales"
        />
      </div>

      {/* Modals */}
      {showModal && (
        <NewAdminMaterialCategoryModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(undefined);
          }}
          editingCategory={editingCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría "{deleteCategory?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}