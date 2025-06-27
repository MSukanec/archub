import { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { Layout } from '@/components/layout/Layout';
import { useMaterialCategories, useDeleteMaterialCategory, MaterialCategory } from '@/hooks/use-material-categories';
import { NewAdminMaterialCategoryModal } from '@/modals/NewAdminMaterialCategoryModal';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function AdminMaterialCategories() {
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
      category.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchValue.toLowerCase()))
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
      setDeleteCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const clearFilters = () => {
    setSearchValue('');
    setSortBy('date');
  };

  const columns = [
    {
      key: 'created_at' as keyof MaterialCategory,
      title: 'Fecha de Creación',
      width: '5%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">
            {format(new Date(category.created_at), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'name' as keyof MaterialCategory,
      title: 'Categoría',
      width: 'flex-1',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{category.name}</p>
            {category.description && (
              <p className="text-xs text-muted-foreground truncate max-w-xs">
                {category.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'creator' as keyof MaterialCategory,
      title: 'Creador',
      width: '5%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={category.creator?.avatar_url || ''} />
            <AvatarFallback>
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {category.creator?.full_name || 'Usuario'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'actions' as keyof MaterialCategory,
      title: 'Acciones',
      width: '5%',
      render: (category: MaterialCategory) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(category)}
            className="h-8 w-8 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteCategory(category)}
            className="h-8 w-8 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  // Statistics
  const totalCategories = categories.length;
  const recentCategories = categories.filter(cat => {
    const daysDiff = (Date.now() - new Date(cat.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  const headerProps = {
    title: "Categorías de Materiales",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters: (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Ordenar por</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha de creación</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
    onClearFilters: clearFilters,
    actions: [
      <Button
        key="new-category"
        onClick={() => {
          setEditingCategory(undefined);
          setShowModal(true);
        }}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Categoría
      </Button>
    ],
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevas esta semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con descripción</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categories.filter(cat => cat.description).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultados filtrados</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCategories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            <CustomTable
              data={filteredCategories}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No se encontraron categorías de materiales"
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <NewAdminMaterialCategoryModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(undefined);
          }}
          category={editingCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría
              "{deleteCategory?.name}" del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}