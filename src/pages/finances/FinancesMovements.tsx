import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { DollarSign, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import { CustomTable } from "@/components/ui-custom/misc/CustomTable";
import { CustomEmptyState } from "@/components/ui-custom/misc/CustomEmptyState";

import { NewMovementModal } from "@/modals/NewMovementModal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMovements } from "@/hooks/use-movements";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";

interface Movement {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  created_by: string;
  organization_id: string;
  project_id: string;
  type_id: string;
  category_id: string;
  subcategory_id?: string;
  currency_id: string;
  wallet_id: string;
  movement_data?: {
    type?: {
      id: string;
      name: string;
    };
    category?: {
      id: string;
      name: string;
    };
    subcategory?: {
      id: string;
      name: string;
    };
    currency?: {
      id: string;
      name: string;
      code: string;
    };
    wallet?: {
      id: string;
      name: string;
    };
  };
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export default function Movements() {
  const [searchValue, setSearchValue] = useState("");
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(
    null,
  );
  const [selectedMovements, setSelectedMovements] = useState<Movement[]>([]);

  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context to project when component mounts
  useEffect(() => {
    setSidebarContext("project");
  }, [setSidebarContext]);

  // Filter states
  const [sortBy, setSortBy] = useState("date");
  const [filterByType, setFilterByType] = useState("all");
  const [filterByCategory, setFilterByCategory] = useState("all");
  const [showConversions, setShowConversions] = useState(false);

  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const projectId = userData?.preferences?.last_project_id;

  const { data: movements = [], isLoading } = useMovements(
    organizationId,
    projectId,
  );

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: string) => {
      const { error } = await supabase
        .from("movements")
        .delete()
        .eq("id", movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setDeletingMovement(null);
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el movimiento",
        variant: "destructive",
      });
    },
  });

  // Delete multiple movements mutation
  const deleteMultipleMovementsMutation = useMutation({
    mutationFn: async (movementIds: string[]) => {
      const { error } = await supabase
        .from("movements")
        .delete()
        .in("id", movementIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setSelectedMovements([]);
      toast({
        title: "Movimientos eliminados",
        description: `${selectedMovements.length} movimientos han sido eliminados correctamente`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los movimientos",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement);
    setShowNewMovementModal(true);
  };

  const handleDelete = (movement: Movement) => {
    setDeletingMovement(movement);
  };

  const confirmDelete = () => {
    if (deletingMovement) {
      deleteMovementMutation.mutate(deletingMovement.id);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMovements.length > 0) {
      deleteMultipleMovementsMutation.mutate(
        selectedMovements.map((m) => m.id),
      );
    }
  };

  // Filter movements
  const filteredMovements = movements
    .filter((movement) => {
      const matchesSearch =
        movement.description
          ?.toLowerCase()
          .includes(searchValue.toLowerCase()) ||
        movement.movement_data?.type?.name
          ?.toLowerCase()
          .includes(searchValue.toLowerCase()) ||
        movement.movement_data?.category?.name
          ?.toLowerCase()
          .includes(searchValue.toLowerCase());

      const matchesType =
        filterByType === "all" ||
        movement.movement_data?.type?.name === filterByType;
      const matchesCategory =
        filterByCategory === "all" ||
        movement.movement_data?.category?.name === filterByCategory;
      const matchesConversion = true; // Add conversion logic if needed

      return (
        matchesSearch && matchesType && matchesCategory && matchesConversion
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "type":
          comparison = (a.movement_data?.type?.name || "").localeCompare(
            b.movement_data?.type?.name || "",
          );
          break;
        case "category":
          comparison = (a.movement_data?.category?.name || "").localeCompare(
            b.movement_data?.category?.name || "",
          );
          break;
      }

      return comparison;
    });

  // Custom filters component
  const customFilters = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Ordenar por
        </Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar orden" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="amount">Monto</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por tipo
        </Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="gasto">Gastos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por categoría
        </Label>
        <Select value={filterByCategory} onValueChange={setFilterByCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="materiales">Materiales</SelectItem>
            <SelectItem value="mano_obra">Mano de obra</SelectItem>
            <SelectItem value="equipos">Equipos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Mostrar conversiones
          </Label>
          <Switch
            checked={showConversions}
            onCheckedChange={setShowConversions}
          />
        </div>
      </div>
    </div>
  );

  const handleClearFilters = () => {
    setSortBy("date");
    setFilterByType("all");
    setFilterByCategory("all");
    setShowConversions(false);
    setSearchValue("");
  };

  const tableColumns = [
    {
      key: "created_at",
      label: "Fecha",
      width: "5%",
      sortable: true,
      sortType: "date" as const,
      render: (movement: Movement) => (
        <div className="text-xs">
          <div>
            {format(new Date(movement.created_at), "dd/MM/yyyy", {
              locale: es,
            })}
          </div>
          <div className="text-muted-foreground text-xs">
            {format(new Date(movement.created_at), "HH:mm", { locale: es })}
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      label: "Creador",
      width: "5%",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={movement.creator?.avatar_url} />
            <AvatarFallback className="text-xs">
              {movement.creator?.full_name?.charAt(0) ||
                movement.creator?.email?.charAt(0) ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate">
            {movement.creator?.full_name ||
              movement.creator?.email ||
              "Usuario"}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Tipo",
      width: "5%",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <span className="text-xs font-medium">
          {movement.movement_data?.type?.name || "Sin tipo"}
        </span>
      ),
    },
    {
      key: "category",
      label: "Categoría",
      width: "10%",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <div>
          <div className="text-xs font-medium">
            {movement.movement_data?.category?.name || "Sin categoría"}
          </div>
          {movement.movement_data?.subcategory?.name && (
            <div className="text-xs text-muted-foreground">
              {movement.movement_data.subcategory.name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "Descripción",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {movement.description || "Sin descripción"}
        </span>
      ),
    },
    {
      key: "currency",
      label: "Moneda",
      width: "5%",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <Badge variant="secondary" className="text-xs">
          {movement.movement_data?.currency?.code || "USD"}
        </Badge>
      ),
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "5%",
      sortable: true,
      sortType: "string" as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {movement.movement_data?.wallet?.name || "Principal"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Cantidad",
      width: "5%",
      sortable: true,
      sortType: "number" as const,
      render: (movement: Movement) => (
        <span className="text-xs font-medium">
          ${movement.amount?.toLocaleString() || "0"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      width: "5%",
      sortable: false,
      render: (movement: Movement) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(movement)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(movement)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const headerProps = {
    title: "Movimientos",
    icon: <DollarSign className="h-5 w-5" />,
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: handleClearFilters,
    actions: [
      selectedMovements.length > 0 && (
        <Button
          key="delete-selected"
          variant="ghost"
          size="icon"
          onClick={handleDeleteSelected}
          disabled={deleteMultipleMovementsMutation.isPending}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      <Button
        key="new-movement"
        onClick={() => {
          setEditingMovement(null);
          setShowNewMovementModal(true);
        }}
        className="h-8"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nuevo movimiento
      </Button>,
    ].filter(Boolean),
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <CustomTable
        columns={tableColumns}
        data={filteredMovements}
        isLoading={isLoading}
        selectable={true}
        getRowClassName={(movement: Movement) => {
          // Determine if it's income or expense based on movement type
          const typeName = movement.movement_data?.type?.name?.toLowerCase() || '';
          const isIncome = typeName.includes('ingreso') || typeName.includes('entrada') || typeName.includes('cobro');
          const isExpense = typeName.includes('egreso') || typeName.includes('gasto') || typeName.includes('pago');
          
          if (isIncome) {
            return 'bg-[var(--movement-income-bg)] border-l-4 border-l-[var(--movement-income-border)]';
          } else if (isExpense) {
            return 'bg-[var(--movement-expense-bg)] border-l-4 border-l-[var(--movement-expense-border)]';
          }
          return '';
        }}
        selectedItems={selectedMovements}
        onSelectionChange={setSelectedMovements}
        getItemId={(movement) => movement.id}
        emptyState={
          <CustomEmptyState 
            title="No hay movimientos registrados"
            description="Crea el primer movimiento del proyecto"
            action={
              <Button
                onClick={() => {
                  setEditingMovement(null);
                  setShowNewMovementModal(true);
                }}
                className="mt-4"
              >
                Nuevo movimiento
              </Button>
            }
          />
        }
      />

      {/* New Movement Modal */}
      {showNewMovementModal && (
        <NewMovementModal
          open={showNewMovementModal}
          onClose={() => {
            setShowNewMovementModal(false);
            setEditingMovement(null);
          }}
          editingMovement={editingMovement}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMovement}
        onOpenChange={() => setDeletingMovement(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMovementMutation.isPending}
            >
              {deleteMovementMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
