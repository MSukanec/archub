import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
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

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Baja';
      case 'medium':
        return 'Media';
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.assignee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesProject = projectFilter === "all" || task.project_id === projectFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        case "due_date":
          aValue = a.due_date || '';
          bValue = b.due_date || '';
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

  // Get unique projects for filter
  const projects = [...new Set(tasks.filter(t => t.project).map(t => t.project))];

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
            <SelectItem value="title">Título</SelectItem>
            <SelectItem value="status">Estado</SelectItem>
            <SelectItem value="priority">Prioridad</SelectItem>
            <SelectItem value="due_date">Fecha límite</SelectItem>
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
        <Label>Filtrar por estado</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Filtrar por prioridad</Label>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Filtrar por proyecto</Label>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los proyectos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const columns = [
    {
      key: 'title',
      label: 'Tarea',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-600" />
          <div>
            <span className="font-medium text-sm">{task.title}</span>
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
      key: 'assignee',
      label: 'Asignado a',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.assignee?.full_name || 'Sin asignar'}
        </span>
      )
    },
    {
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.project?.name || 'Sin proyecto'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
          {getStatusLabel(task.status)}
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Prioridad',
      sortable: true,
      sortType: 'string' as const,
      render: (task: Task) => (
        <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
          {getPriorityLabel(task.priority)}
        </Badge>
      )
    },
    {
      key: 'due_date',
      label: 'Fecha Límite',
      sortable: true,
      sortType: 'date' as const,
      render: (task: Task) => (
        <span className="text-xs">
          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}
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
    </CustomPageLayout>
  );
}