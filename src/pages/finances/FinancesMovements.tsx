import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { DollarSign, Plus, Edit, Trash2, Heart, Search, Filter, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from "@/components/layout/desktop/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FinancialCards } from "@/components/ui-custom/misc/FinancialCards";
import MovementCard from "@/components/cards/MovementCard";
import ConversionCard from "@/components/cards/ConversionCard";
import { transformMovementToCard } from "@/utils/movementCardAdapter";

import { NewMovementModal } from "@/modals/finances/NewMovementModal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMovements, useToggleMovementFavorite } from "@/hooks/use-movements";
import { useOrganizationDefaultCurrency } from "@/hooks/use-currencies";
import { getMovementFiles } from "@/lib/storage/uploadMovementFiles";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";

interface Movement {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  movement_date: string;
  created_by: string;
  organization_id: string;
  project_id: string;
  type_id: string;
  category_id: string;
  subcategory_id?: string;
  currency_id: string;
  wallet_id: string;
  is_favorite?: boolean;
  conversion_group_id?: string;
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

interface ConversionGroup {
  id: string;
  conversion_group_id: string;
  movements: Movement[];
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  description: string;
  movement_date: string;
  created_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  is_conversion_group: true;
}

export default function Movements() {
  const [searchValue, setSearchValue] = useState("");
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(
    null,
  );
  const [selectedMovements, setSelectedMovements] = useState<Movement[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [movementFileCounts, setMovementFileCounts] = useState<Record<string, number>>({});

  const { setSidebarContext } = useNavigationStore();
  const { setActions, setShowActionBar, clearActions } = useMobileActionBar();
  const isMobile = useMobile();

  // Set sidebar context to finances when component mounts
  useEffect(() => {
    setSidebarContext("finances");
  }, [setSidebarContext]);

  // Configure mobile action bar when page mounts
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot2: {
          id: 'search',
          icon: <Search className="h-5 w-5" />,
          label: 'Buscar',
          onClick: () => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          },
        },
        slot3: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nuevo Movimiento',
          onClick: () => setShowNewMovementModal(true),
          variant: 'primary'
        },
        slot4: {
          id: 'filter',
          icon: <Filter className="h-5 w-5" />,
          label: 'Filtros',
          onClick: () => {
            console.log("Filter clicked");
          },
        },
        slot5: {
          id: 'clear',
          icon: <X className="h-5 w-5" />,
          label: 'Limpiar',
          onClick: () => {
            setSearchValue("");
            setSortBy("date");
            setFilterByType("all");
            setFilterByCategory("all");
            setShowConversions(false);
          },
        }
      });
      setShowActionBar(true);
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile]); // Removed unstable dependencies

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

  // Get organization's default currency
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);

  // Load file counts for all movements
  useEffect(() => {
    const loadFileCounts = async () => {
      if (!movements.length) return;
      
      const counts: Record<string, number> = {};
      
      // Load file counts for each movement
      for (const item of movements) {
        let movementId: string;
        
        if ('is_conversion_group' in item) {
          // For conversion groups, get the first movement (egreso) ID
          const conversionGroup = item as any;
          const egresoMovement = conversionGroup.movements?.find((m: any) => 
            m.movement_data?.type?.name?.toLowerCase().includes('egreso')
          );
          movementId = egresoMovement?.id || '';
        } else {
          movementId = item.id;
        }
        
        if (movementId && !counts[movementId]) {
          try {
            const files = await getMovementFiles(movementId);
            counts[movementId] = files.length;
          } catch (error) {
            console.error(`Error loading files for movement ${movementId}:`, error);
            counts[movementId] = 0;
          }
        }
      }
      
      setMovementFileCounts(counts);
    };

    loadFileCounts();
  }, [movements]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useToggleMovementFavorite();

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (movementOrId: string | Movement) => {
      // Check if it's a conversion deletion
      if (typeof movementOrId === 'object' && (movementOrId as any)._isConversionDeletion) {
        const conversionData = (movementOrId as any)._conversionData;
        const movementIds = conversionData.movements.map((m: Movement) => m.id);
        
        // Delete all movements in the conversion group
        const { error } = await supabase
          .from("movements")
          .delete()
          .in("id", movementIds);

        if (error) throw error;
        return { isConversion: true, count: movementIds.length };
      } else {
        // Regular single movement deletion
        const movementId = typeof movementOrId === 'string' ? movementOrId : movementOrId.id;
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("id", movementId);

        if (error) throw error;
        return { isConversion: false, count: 1 };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setDeletingMovement(null);
      toast({
        title: result.isConversion ? "Conversión eliminada" : "Movimiento eliminado",
        description: result.isConversion 
          ? "La conversión completa ha sido eliminada correctamente"
          : "El movimiento ha sido eliminado correctamente",
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

  const handleEditConversion = (conversionGroup: ConversionGroup) => {
    // For conversions, we need to set special data so the modal can handle it
    const egresoMovement = conversionGroup.movements.find(m => 
      m.movement_data?.type?.name?.toLowerCase().includes('egreso')
    ) || conversionGroup.movements[0];
    
    // Add conversion metadata to the movement
    const conversionMovement = {
      ...egresoMovement,
      _isConversion: true,
      _conversionData: conversionGroup
    };
    
    setEditingMovement(conversionMovement as any);
    setShowNewMovementModal(true);
  };

  const handleDelete = (movement: Movement) => {
    setDeletingMovement(movement);
  };

  const handleDeleteConversion = (conversionGroup: ConversionGroup) => {
    // Use the first movement as the deleting movement but mark it as a conversion deletion
    const firstMovement = conversionGroup.movements[0];
    const movementWithConversionData = {
      ...firstMovement,
      _isConversionDeletion: true,
      _conversionData: conversionGroup
    };
    setDeletingMovement(movementWithConversionData as any);
  };

  const handleToggleFavorite = async (movement: Movement) => {
    try {
      await toggleFavoriteMutation.mutateAsync({
        movementId: movement.id,
        isFavorite: !movement.is_favorite,
      });
      toast({
        title: movement.is_favorite
          ? "Eliminado de favoritos"
          : "Agregado a favoritos",
        description: "El movimiento se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de favorito.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (deletingMovement) {
      deleteMovementMutation.mutate(deletingMovement);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMovements.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedMovements.length > 0) {
      deleteMultipleMovementsMutation.mutate(
        selectedMovements.map((m) => m.id),
      );
      setShowBulkDeleteDialog(false);
    }
  };

  // Get unique types, categories, and subcategories from actual data
  const availableTypes = Array.from(
    new Set(movements.map((m) => m.movement_data?.type?.name).filter(Boolean)),
  );

  const availableCategories = Array.from(
    new Set(
      movements.map((m) => m.movement_data?.category?.name).filter(Boolean),
    ),
  );

  const availableSubcategories = Array.from(
    new Set(
      movements.map((m) => m.movement_data?.subcategory?.name).filter(Boolean),
    ),
  );

  // Group movements by conversion_group_id
  const groupConversions = (movements: Movement[]): (Movement | ConversionGroup)[] => {
    const conversionGroups = new Map<string, Movement[]>();
    const regularMovements: Movement[] = [];

    // Separate movements with conversion_group_id from regular movements
    movements.forEach(movement => {
      if (movement.conversion_group_id) {
        if (!conversionGroups.has(movement.conversion_group_id)) {
          conversionGroups.set(movement.conversion_group_id, []);
        }
        conversionGroups.get(movement.conversion_group_id)!.push(movement);
      } else {
        regularMovements.push(movement);
      }
    });

    // Create conversion group objects
    const conversionGroupObjects: ConversionGroup[] = [];
    conversionGroups.forEach((groupMovements, groupId) => {
      if (groupMovements.length >= 2) {
        // Find egreso and ingreso movements
        const egresoMovement = groupMovements.find(m => 
          m.movement_data?.type?.name?.toLowerCase().includes('egreso')
        );
        const ingresoMovement = groupMovements.find(m => 
          m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
        );

        if (egresoMovement && ingresoMovement) {
          const conversionGroup: ConversionGroup = {
            id: groupId,
            conversion_group_id: groupId,
            movements: groupMovements,
            from_currency: egresoMovement.movement_data?.currency?.code || 'N/A',
            to_currency: ingresoMovement.movement_data?.currency?.code || 'N/A',
            from_amount: egresoMovement.amount,
            to_amount: ingresoMovement.amount,
            description: egresoMovement.description || 'Conversión',
            movement_date: egresoMovement.movement_date,
            created_at: egresoMovement.created_at,
            creator: egresoMovement.creator,
            is_conversion_group: true
          };
          conversionGroupObjects.push(conversionGroup);
        }
      } else {
        // If only one movement in group, treat as regular movement
        regularMovements.push(...groupMovements);
      }
    });

    return [...conversionGroupObjects, ...regularMovements];
  };

  // Filter movements (applied before grouping)
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
          .includes(searchValue.toLowerCase()) ||
        movement.movement_data?.subcategory?.name
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
    });

  // Group conversions and sort
  const processedMovements = groupConversions(filteredMovements)
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "amount":
          if ('is_conversion_group' in a && 'is_conversion_group' in b) {
            comparison = a.from_amount - b.from_amount;
          } else if ('is_conversion_group' in a) {
            comparison = a.from_amount - (b as Movement).amount;
          } else if ('is_conversion_group' in b) {
            comparison = (a as Movement).amount - b.from_amount;
          } else {
            comparison = (a as Movement).amount - (b as Movement).amount;
          }
          break;
        case "type":
          const aType = 'is_conversion_group' in a ? 'Conversión' : (a as Movement).movement_data?.type?.name || '';
          const bType = 'is_conversion_group' in b ? 'Conversión' : (b as Movement).movement_data?.type?.name || '';
          comparison = aType.localeCompare(bType);
          break;
        case "category":
          const aCategory = 'is_conversion_group' in a ? 'Conversión' : (a as Movement).movement_data?.category?.name || '';
          const bCategory = 'is_conversion_group' in b ? 'Conversión' : (b as Movement).movement_data?.category?.name || '';
          comparison = aCategory.localeCompare(bCategory);
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
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type!}>
                {type}
              </SelectItem>
            ))}
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
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category!}>
                {category}
              </SelectItem>
            ))}
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

  // Calculate balance by currency
  const calculateBalanceByCurrency = () => {
    const balanceMap = new Map<string, { income: number; expense: number; balance: number; currency: string }>();
    
    filteredMovements.forEach((movement) => {
      const currency = movement.movement_data?.currency?.name || 'Unknown';
      const amount = movement.amount || 0;
      const typeName = movement.movement_data?.type?.name || "";
      
      if (!balanceMap.has(currency)) {
        balanceMap.set(currency, { income: 0, expense: 0, balance: 0, currency });
      }
      
      const balance = balanceMap.get(currency)!;
      
      if (typeName === "Ingresos" || typeName.toLowerCase().includes("ingreso")) {
        balance.income += amount;
      } else if (typeName === "Egresos" || typeName.toLowerCase().includes("egreso")) {
        balance.expense += amount;
      }
      
      balance.balance = balance.income - balance.expense;
    });
    
    return Array.from(balanceMap.values());
  };

  const currencyBalances = calculateBalanceByCurrency();

  const tableColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "5%",
      sortable: true,
      sortType: "date" as const,
      render: (item: Movement | ConversionGroup) => {
        const displayDate = item.movement_date;

        if (!displayDate) {
          return <div className="text-xs text-muted-foreground">Sin fecha</div>;
        }

        try {
          // Handle different date formats properly
          let date;
          if (displayDate.includes('T')) {
            // ISO format with time - parse normally but format as local date
            date = new Date(displayDate);
          } else {
            // Date only format - force local timezone to avoid UTC shift
            date = new Date(displayDate + 'T00:00:00');
          }
          
          if (isNaN(date.getTime())) {
            return (
              <div className="text-xs text-muted-foreground">
                Fecha inválida
              </div>
            );
          }

          return (
            <div className="text-xs">
              <div>{format(date, "dd/MM/yyyy", { locale: es })}</div>
            </div>
          );
        } catch (error) {
          return (
            <div className="text-xs text-muted-foreground">Fecha inválida</div>
          );
        }
      },
    },
    {
      key: "creator",
      label: "Creador",
      width: "10%",
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={item.creator?.avatar_url} />
            <AvatarFallback className="text-xs">
              {item.creator?.full_name?.charAt(0) ||
                item.creator?.email?.charAt(0) ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate">
            {item.creator?.full_name ||
              item.creator?.email ||
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
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <span className="text-xs font-medium">
              Conversión
            </span>
          );
        }
        return (
          <span className="text-xs font-medium">
            {item.movement_data?.type?.name || "Sin tipo"}
          </span>
        );
      },
    },
    {
      key: "category",
      label: "Categoría",
      width: "10%",
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div>
              <div className="text-xs font-medium">
                Conversión
              </div>
              <div className="text-xs text-muted-foreground">
                {item.from_currency} → {item.to_currency}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div className="text-xs font-medium">
              {item.movement_data?.category?.name || "Sin categoría"}
            </div>
            {item.movement_data?.subcategory?.name && (
              <div className="text-xs text-muted-foreground">
                {item.movement_data.subcategory.name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "description",
      label: "Descripción",
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div>
              <div className="text-xs font-medium">
                Conversión {item.from_currency} → {item.to_currency}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.description || "Sin descripción"}
              </div>
            </div>
          );
        }
        return (
          <span className="text-xs">
            {item.description || "Sin descripción"}
          </span>
        );
      },
    },
    {
      key: "currency",
      label: "Moneda",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">
                {item.from_currency}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.to_currency}
              </Badge>
            </div>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {item.movement_data?.currency?.code || "USD"}
          </Badge>
        );
      },
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          const egresoMovement = item.movements.find(m => 
            m.movement_data?.type?.name?.toLowerCase().includes('egreso')
          );
          const ingresoMovement = item.movements.find(m => 
            m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
          );
          return (
            <div className="text-xs space-y-1">
              <div>{egresoMovement?.movement_data?.wallet?.name || "Principal"}</div>
              <div>{ingresoMovement?.movement_data?.wallet?.name || "Principal"}</div>
            </div>
          );
        }
        return (
          <span className="text-xs">
            {item.movement_data?.wallet?.name || "Principal"}
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Cantidad",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="text-xs space-y-1">
              <div className="font-medium text-red-600">
                -${item.from_amount?.toLocaleString() || "0"}
              </div>
              <div className="font-medium text-green-600">
                +${item.to_amount?.toLocaleString() || "0"}
              </div>
            </div>
          );
        }
        return (
          <span className="text-xs font-medium">
            ${item.amount?.toLocaleString() || "0"}
          </span>
        );
      },
    },
    {
      key: "attachments",
      label: "Adjuntos",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup) => {
        // For conversion groups, get files from the first movement (egreso)
        if ('is_conversion_group' in item) {
          const egresoMovement = item.movements.find(m => 
            m.movement_data?.type?.name?.toLowerCase().includes('egreso')
          );
          const fileCount = egresoMovement ? movementFileCounts[egresoMovement.id] || 0 : 0;
          return (
            <div className="flex items-center justify-center">
              <span className={`text-xs ${fileCount > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                {fileCount}
              </span>
            </div>
          );
        }
        
        // For regular movements, get file count from state
        const fileCount = movementFileCounts[item.id] || 0;
        return (
          <div className="flex items-center justify-center">
            <span className={`text-xs ${fileCount > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
              {fileCount}
            </span>
          </div>
        );
      },
    },
  ];

  const headerProps = {
    title: "Movimientos",
    icon: DollarSign,
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
      {/* Financial Cards - Responsive */}
      <FinancialCards 
        balances={currencyBalances} 
        defaultCurrency={defaultCurrency?.name}
      />
      
      <CustomTable
        columns={tableColumns}
        data={processedMovements}
        isLoading={isLoading}
        selectable={true}
        defaultSort={{
          key: "movement_date",
          direction: "desc",
        }}
        getRowClassName={(item: Movement | ConversionGroup) => {
          if ('is_conversion_group' in item) {
            return "movement-row-conversion";
          }
          // Determine if it's income or expense based on movement type
          const typeName = item.movement_data?.type?.name || "";
          
          if (typeName === "Ingresos" || typeName.toLowerCase().includes("ingreso")) {
            return "movement-row-income";
          } else if (typeName === "Egresos" || typeName.toLowerCase().includes("egreso")) {
            return "movement-row-expense";
          }
          return "";
        }}
        selectedItems={selectedMovements}
        onSelectionChange={(items) => {
          // Only allow selection of regular movements, not conversion groups
          const regularMovements = items.filter(item => !('is_conversion_group' in item)) as Movement[];
          setSelectedMovements(regularMovements);
        }}
        getItemId={(item) => item.id}
        renderCard={(item: Movement | ConversionGroup) => {
          if ('is_conversion_group' in item) {
            // Render ConversionCard for conversion groups
            return (
              <ConversionCard
                conversion={item}
                onEdit={handleEditConversion}
                onDelete={handleDeleteConversion}
                onToggleFavorite={(conversionGroup) => {
                  // Toggle favorite for all movements in the group
                  conversionGroup.movements.forEach(movement => {
                    handleToggleFavorite(movement);
                  });
                }}
              />
            );
          } else {
            // Render MovementCard for regular movements
            return (
              <MovementCard
                movement={transformMovementToCard(item)}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            );
          }
        }}


        getRowActions={(item: Movement | ConversionGroup) => {
          if ('is_conversion_group' in item) {
            // Actions for conversion groups - apply to both movements
            const isGroupFavorited = item.movements.some(m => m.is_favorite);
            return [
              {
                icon: isGroupFavorited ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />,
                label: isGroupFavorited ? "Quitar de favoritos" : "Agregar a favoritos",
                onClick: () => {
                  // Toggle favorite for all movements in the group
                  item.movements.forEach(movement => {
                    handleToggleFavorite(movement);
                  });
                },
                variant: isGroupFavorited ? "muted" : "default",
                isActive: isGroupFavorited
              },
              {
                icon: <Pencil className="h-4 w-4" />,
                label: "Editar conversión",
                onClick: () => {
                  handleEditConversion(item);
                },
                variant: "primary"
              },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: "Eliminar conversión",
                onClick: () => {
                  handleDeleteConversion(item);
                },
                variant: "destructive"
              }
            ];
          }
          return [
            {
              icon: item.is_favorite ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />,
              label: item.is_favorite ? "Quitar de favoritos" : "Agregar a favoritos",
              onClick: () => handleToggleFavorite(item),
              variant: item.is_favorite ? "muted" : "default",
              isActive: item.is_favorite
            },
            {
              icon: <Pencil className="h-4 w-4" />,
              label: "Editar",
              onClick: () => handleEdit(item),
              variant: "primary"
            },
            {
              icon: <Trash2 className="h-4 w-4" />,
              label: "Eliminar",
              onClick: () => handleDelete(item),
              variant: "destructive"
            }
          ];
        }}
        emptyState={
          <CustomEmptyState
            icon={<DollarSign className="h-12 w-12" />}
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
                <Plus className="h-4 w-4 mr-2" />
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
            <AlertDialogTitle>
              {(deletingMovement as any)?._isConversionDeletion 
                ? "¿Eliminar conversión completa?" 
                : "¿Eliminar movimiento?"
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(deletingMovement as any)?._isConversionDeletion 
                ? "Esta acción no se puede deshacer. La conversión completa (ambos movimientos) será eliminada permanentemente."
                : "Esta acción no se puede deshacer. El movimiento será eliminado permanentemente."
              }
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={() => setShowBulkDeleteDialog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedMovements.length} movimientos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los {selectedMovements.length} movimientos seleccionados serán eliminados
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={deleteMultipleMovementsMutation.isPending}
            >
              {deleteMultipleMovementsMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
