import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomTable } from "@/components/ui-custom/CustomTable";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NewTaskModal } from "@/modals/NewTaskModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Task {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  category_id?: string;
  subcategory_id?: string;
  element_category_id?: string;
  unit_id?: string;
  action_id?: string;
  element_id?: string;
  unit_labor_price?: number;
  unit_material_price?: number;
  created_at: string;
  category?: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  element_category?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  action?: {
    id: string;
    name: string;
  };
  element?: {
    id: string;
    name: string;
  };
}

export function AdminTasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { toast } = useToast();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          name,
          description,
          organization_id,
          category_id,
          subcategory_id,
          element_category_id,
          unit_id,
          action_id,
          element_id,
          unit_labor_price,
          unit_material_price,
          created_at,
          category:categories (
            id,
            name
          ),
          subcategory:subcategories (
            id,
            name
          ),
          element_category:element_categories (
            id,
            name
          ),
          unit:units (
            id,
            name
          ),
          action:actions (
            id,
            name
          ),
          element:elements (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar la tarea.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setOpenModal(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingTask(null);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("created_at");
    setSortOrder("desc");
    setCategoryFilter("all");
  };



  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.element?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || task.category_id === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "category":
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        case "unit_labor_price":
          aValue = a.unit_labor_price || 0;
          bValue = b.unit_labor_price || 0;
          break;
        case "unit_material_price":
          aValue = a.unit_material_price || 0;
          bValue = b.unit_material_price || 0;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique categories for filter
  const categories = [...new Set(tasks.filter(t => t.category).map(t => t.category))];

  const customFilters = (
    <div className="space-y-4 w-[288px]">
      <div>
        <Label>Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
            <SelectItem value="unit_labor_price">Precio de Mano de Obra</SelectItem>
            <SelectItem value="unit_material_price">Precio de Material</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Dirección</Label>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descendente</SelectItem>
            <SelectItem value="asc">Ascendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Filtrar por categoría</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const columns = [
    {
      key: 'name',
      label: 'Tarea',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-600" />
          <div>
            <span className="font-medium text-sm">{task.name}</span>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.category?.name || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'subcategory',
      label: 'Subcategoría',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.subcategory?.name || 'Sin subcategoría'}
        </span>
      )
    },
    {
      key: 'element',
      label: 'Elemento',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.element?.name || 'Sin elemento'}
        </span>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.unit?.name || 'Sin unidad'}
        </span>
      )
    },
    {
      key: 'unit_labor_price',
      label: 'Precio M.O.',
      sortable: true,
      sortType: 'number' as const,
      render: (task: Task) => (
        <span className="text-xs">
          ${task.unit_labor_price?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      key: 'unit_material_price',
      label: 'Precio Material',
      sortable: true,
      sortType: 'number' as const,
      render: (task: Task) => (
        <span className="text-xs">
          ${task.unit_material_price?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      sortable: true,
      sortType: 'date' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {new Date(task.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (task: Task) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(task)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const emptyState = (
    <div className="text-center py-12">
      <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">No se encontraron tareas</p>
      <Button className="mt-4" onClick={() => setOpenModal(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Crear nueva tarea
      </Button>
    </div>
  );

  return (
    <CustomPageLayout
      icon={CheckSquare}
      title="Gestión de Tareas"
      actions={[
        <Button key="new" onClick={() => setOpenModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      ]}
      showSearch
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      customFilters={customFilters}
      onClearFilters={handleClearFilters}
    >
      <CustomTable 
        columns={columns}
        data={filteredTasks}
        isLoading={isLoading}
        emptyState={emptyState}
      />

      <NewTaskModal
        open={openModal}
        onClose={handleCloseModal}
        editingTask={editingTask}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la tarea "{taskToDelete?.title}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
  );
}