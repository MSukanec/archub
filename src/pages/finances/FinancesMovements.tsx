import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { DollarSign, Plus, Edit, Trash2, Heart, Search, Filter, X, Pencil, Upload, TrendingUp, FileText, Users, BarChart3, Tag, FolderTree, Star, Coins, Wallet } from "lucide-react";
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
import { Table } from "@/components/ui-custom/Table";
import { EmptyState } from "@/components/ui-custom/EmptyState";

import { FeatureIntroduction } from "@/components/ui-custom/FeatureIntroduction";
import { ActionBarDesktop } from "@/components/layout/desktop/ActionBarDesktop";
import { ActionBarDesktopRow } from "@/components/layout/desktop/ActionBarDesktopRow";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";

import MovementCard from "@/components/cards/MovementCard";
import ConversionCard from "@/components/cards/ConversionCard";
import TransferCard, { TransferGroup } from "@/components/cards/TransferCard";
import { transformMovementToCard } from "@/utils/movementCardAdapter";


import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMovements, useToggleMovementFavorite } from "@/hooks/use-movements";
import { useOrganizationDefaultCurrency, useOrganizationCurrencies } from "@/hooks/use-currencies";
import { useOrganizationWallets } from "@/hooks/use-organization-wallets";
import { useProjectsMap } from "@/hooks/use-projects";
import { ProjectBadge } from "@/components/ui-custom/ProjectBadge";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";
import { useProjectContext } from "@/stores/projectContext";

interface Movement {
  id: string;
  description: string;
  amount: number;
  exchange_rate?: number;
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
  transfer_group_id?: string;
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
  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const [searchValue, setSearchValue] = useState("");

  const { openModal } = useGlobalModalStore();

  const [selectedMovements, setSelectedMovements] = useState<Movement[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);


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
          onClick: () => openModal('movement'),
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
            setFilterByType("all");
            setFilterByCategory("all");
            setFilterBySubcategory("all");
            setFilterByScope("all");
            setFilterByFavorites("all");
            setFilterByCurrency("all");
            setFilterByWallet("all");
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
  const [filterByType, setFilterByType] = useState("all");
  const [filterByCategory, setFilterByCategory] = useState("all");
  const [filterBySubcategory, setFilterBySubcategory] = useState("all");
  const [filterByScope, setFilterByScope] = useState("all");
  const [filterByFavorites, setFilterByFavorites] = useState("all");
  const [filterByCurrency, setFilterByCurrency] = useState("all");
  const [filterByWallet, setFilterByWallet] = useState("all");

  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { selectedProjectId, isGlobalView } = useProjectContext();
  const projectId = selectedProjectId;



  const { data: movements = [], isLoading } = useMovements(
    organizationId,
    projectId,
  );

  // Get organization's default currency
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  
  // Get organization currencies and wallets for filters
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);
  const { data: organizationWallets = [] } = useOrganizationWallets(organizationId);
  
  // Get projects map for the project badges (only when in GENERAL mode)
  const { data: projectsMap = {} } = useProjectsMap(organizationId);
  
  // Use isGlobalView from store instead of deriving from projectId  
  const isGeneralMode = isGlobalView;



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
          .in("id", movementIds)
          .eq("organization_id", organizationId);

        if (error) throw error;
        return { isConversion: true, isTransfer: false, count: movementIds.length };
      } else if (typeof movementOrId === 'object' && (movementOrId as any)._isTransferDeletion) {
        const transferData = (movementOrId as any)._transferData;
        const movementIds = transferData.movements.map((m: Movement) => m.id);
        
        // Delete all movements in the transfer group
        const { error } = await supabase
          .from("movements")
          .delete()
          .in("id", movementIds)
          .eq("organization_id", organizationId);

        if (error) throw error;
        return { isConversion: false, isTransfer: true, count: movementIds.length };
      } else {
        // Regular single movement deletion
        const movementId = typeof movementOrId === 'string' ? movementOrId : movementOrId.id;
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("id", movementId)
          .eq("organization_id", organizationId);

        if (error) throw error;
        return { isConversion: false, isTransfer: false, count: 1 };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setDeletingMovement(null);
      toast({
        title: result.isConversion 
          ? "Conversión eliminada" 
          : result.isTransfer 
            ? "Transferencia eliminada" 
            : "Movimiento eliminado",
        description: result.isConversion 
          ? "La conversión completa ha sido eliminada correctamente"
          : result.isTransfer 
            ? "La transferencia completa ha sido eliminada correctamente"
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
        .in("id", movementIds)
        .eq("organization_id", organizationId);

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
    openModal('movement', { editingMovement: movement });
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
    
    openModal('movement', { editingMovement: conversionMovement as any });
  };

  const handleEditTransfer = (transferGroup: TransferGroup) => {
    // For transfers, we need to set special data so the modal can handle it
    const egresoMovement = transferGroup.movements.find(m => 
      m.movement_data?.type?.name?.toLowerCase().includes('egreso')
    ) || transferGroup.movements[0];
    
    // Add transfer metadata to the movement
    const transferMovement = {
      ...egresoMovement,
      _isTransfer: true,
      _transferData: transferGroup
    };
    
    openModal('movement', { editingMovement: transferMovement as any });
  };

  const handleDelete = (movement: Movement) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar movimiento',
      description: 'Esta acción no se puede deshacer. El movimiento será eliminado permanentemente.',
      itemName: movement.description,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteMovementMutation.mutate(movement),
      isLoading: deleteMovementMutation.isPending
    });
  };

  const handleDeleteConversion = (conversionGroup: ConversionGroup) => {
    const firstMovement = conversionGroup.movements[0];
    const movementWithConversionData = {
      ...firstMovement,
      _isConversionDeletion: true,
      _conversionData: conversionGroup
    };
    
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar conversión completa',
      description: 'Esta acción no se puede deshacer. La conversión completa (ambos movimientos) será eliminada permanentemente.',
      itemName: conversionGroup.description,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteMovementMutation.mutate(movementWithConversionData as any),
      isLoading: deleteMovementMutation.isPending
    });
  };

  const handleDeleteTransfer = (transferGroup: TransferGroup) => {
    const firstMovement = transferGroup.movements[0];
    const movementWithTransferData = {
      ...firstMovement,
      _isTransferDeletion: true,
      _transferData: transferGroup
    };
    
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar transferencia completa',
      description: 'Esta acción no se puede deshacer. La transferencia completa (ambos movimientos) será eliminada permanentemente.',
      itemName: transferGroup.description,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteMovementMutation.mutate(movementWithTransferData as any),
      isLoading: deleteMovementMutation.isPending
    });
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

  const availableCurrencies = Array.from(
    new Set(
      movements.map((m) => m.movement_data?.currency?.name).filter(Boolean),
    ),
  );

  const availableWallets = Array.from(
    new Set(
      movements.map((m) => m.movement_data?.wallet?.name).filter(Boolean),
    ),
  );



  // Group movements by conversion_group_id
  const groupConversions = (movements: Movement[]): (Movement | ConversionGroup | TransferGroup)[] => {
    const conversionGroups = new Map<string, Movement[]>();
    const transferGroups = new Map<string, Movement[]>();
    const regularMovements: Movement[] = [];



    // Separate movements with group IDs from regular movements
    movements.forEach(movement => {
      if (movement.conversion_group_id) {
        if (!conversionGroups.has(movement.conversion_group_id)) {
          conversionGroups.set(movement.conversion_group_id, []);
        }
        conversionGroups.get(movement.conversion_group_id)!.push(movement);
      } else if (movement.transfer_group_id) {
        if (!transferGroups.has(movement.transfer_group_id)) {
          transferGroups.set(movement.transfer_group_id, []);
        }
        transferGroups.get(movement.transfer_group_id)!.push(movement);
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

    // Create transfer group objects
    const transferGroupObjects: TransferGroup[] = [];
    transferGroups.forEach((groupMovements, groupId) => {
      if (groupMovements.length >= 2) {
        // Find egreso and ingreso movements for transfer
        const egresoMovement = groupMovements.find(m => 
          m.movement_data?.type?.name?.toLowerCase().includes('egreso')
        );
        const ingresoMovement = groupMovements.find(m => 
          m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
        );

        if (egresoMovement && ingresoMovement) {
          const transferGroup: TransferGroup = {
            id: groupId,
            transfer_group_id: groupId,
            movements: groupMovements,
            currency: egresoMovement.movement_data?.currency?.code || 'N/A',
            amount: egresoMovement.amount,
            description: egresoMovement.description || 'Transferencia Interna',
            movement_date: egresoMovement.movement_date,
            created_at: egresoMovement.created_at,
            creator: egresoMovement.creator,
            from_wallet: egresoMovement.movement_data?.wallet?.name || 'N/A',
            to_wallet: ingresoMovement.movement_data?.wallet?.name || 'N/A',
            is_transfer_group: true
          };
          transferGroupObjects.push(transferGroup);
        }
      } else {
        // If only one movement in group, treat as regular movement
        regularMovements.push(...groupMovements);
      }
    });

    return [...conversionGroupObjects, ...transferGroupObjects, ...regularMovements];
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
      
      const matchesSubcategory =
        filterBySubcategory === "all" ||
        movement.movement_data?.subcategory?.name === filterBySubcategory;
      const matchesFavorites =
        filterByFavorites === "all" ||
        (filterByFavorites === "favorites" && movement.is_favorite);
      
      const matchesScope =
        filterByScope === "all" ||
        (filterByScope === "organization" && !movement.project_id) ||
        (filterByScope === "project" && movement.project_id);
      
      const matchesCurrency =
        filterByCurrency === "all" ||
        movement.movement_data?.currency?.name === filterByCurrency;
      
      const matchesWallet =
        filterByWallet === "all" ||
        movement.movement_data?.wallet?.name === filterByWallet;

      return (
        matchesSearch && matchesType && matchesCategory && matchesSubcategory && matchesFavorites && matchesScope && matchesCurrency && matchesWallet
      );
    });



  // Group conversions - let CustomTable handle sorting
  const processedMovements = groupConversions(filteredMovements);

  // Custom filters component
  const customFilters = (
    <div className="space-y-4">


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

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por subcategoría
        </Label>
        <Select value={filterBySubcategory} onValueChange={setFilterBySubcategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las subcategorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las subcategorías</SelectItem>
            {availableSubcategories
              .filter(subcategory => {
                if (filterByCategory === "all") return true;
                // Filter subcategories based on selected category
                const relevantMovements = movements.filter(m => 
                  m.movement_data?.category?.name === filterByCategory
                );
                return relevantMovements.some(m => 
                  m.movement_data?.subcategory?.name === subcategory
                );
              })
              .map((subcategory) => (
                <SelectItem key={subcategory} value={subcategory!}>
                  {subcategory}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por alcance
        </Label>
        <Select value={filterByScope} onValueChange={setFilterByScope}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todos los movimientos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los movimientos</SelectItem>
            <SelectItem value="organization">Solo organizacionales</SelectItem>
            <SelectItem value="project">Solo de proyectos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por favoritos
        </Label>
        <Select value={filterByFavorites} onValueChange={setFilterByFavorites}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todos los movimientos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los movimientos</SelectItem>
            <SelectItem value="favorites">Solo favoritos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por moneda
        </Label>
        <Select value={filterByCurrency} onValueChange={setFilterByCurrency}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las monedas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las monedas</SelectItem>
            {organizationCurrencies.map((orgCurrency) => (
              <SelectItem key={orgCurrency.currency.id} value={orgCurrency.currency.name}>
                {orgCurrency.currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por billetera
        </Label>
        <Select value={filterByWallet} onValueChange={setFilterByWallet}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las billeteras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las billeteras</SelectItem>
            {organizationWallets.map((orgWallet) => (
              <SelectItem key={orgWallet.id} value={orgWallet.wallets.name}>
                {orgWallet.wallets.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const handleClearFilters = () => {
    setFilterByType("all");
    setFilterByCategory("all");
    setFilterBySubcategory("all");
    setFilterByScope("all");
    setFilterByFavorites("all");
    setFilterByCurrency("all");
    setFilterByWallet("all");
    setSearchValue("");
  };





  const tableColumns = useMemo(() => [
    // Columna "Proyecto" - solo visible en modo GENERAL (cuando no hay proyecto seleccionado)
    ...(isGeneralMode ? [{
      key: "project",
      label: "Proyecto", 
      width: "8%",
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => {
        // Para grupos de conversión y transferencia, usar el project_id del primer movimiento
        let itemProjectId: string | null = null;
        
        if ('is_conversion_group' in item || 'is_transfer_group' in item) {
          const group = item as any;
          itemProjectId = group.movements?.[0]?.project_id || null;
        } else {
          itemProjectId = (item as Movement).project_id || null;
        }
        
        return (
          <ProjectBadge 
            projectId={itemProjectId}
            projectsMap={projectsMap}
          />
        );
      },
    }] : []),
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
        
        if ('is_transfer_group' in item) {
          return (
            <span className="text-xs font-medium">
              Transferencia
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
      width: "15%", // Aumentado de 10% a 15% (1.5x)
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="text-xs">
              <span className="font-bold">Conversión</span> - {item.from_currency} → {item.to_currency}
            </div>
          );
        }
        
        if ('is_transfer_group' in item) {
          return (
            <div className="text-xs">
              <span className="font-bold">Transferencia</span> - {item.from_wallet} → {item.to_wallet}
            </div>
          );
        }
        
        const categoryName = item.movement_data?.category?.name || "Sin categoría";
        const subcategoryName = item.movement_data?.subcategory?.name;
        
        return (
          <div className="space-y-1">
            <div className="text-xs font-bold">{categoryName}</div>
            {subcategoryName && (
              <div className="text-xs text-muted-foreground">{subcategoryName}</div>
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
        
        if ('is_transfer_group' in item) {
          return (
            <div>
              <div className="text-xs font-medium">
                Transferencia {item.from_wallet} → {item.to_wallet}
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
      render: (item: Movement | ConversionGroup | TransferGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="text-xs space-y-1">
              <div>{item.from_currency}</div>
              <div>{item.to_currency}</div>
            </div>
          );
        }
        
        if ('is_transfer_group' in item) {
          return (
            <div className="text-xs">
              <div>{item.currency}</div>
            </div>
          );
        }
        
        return (
          <div className="text-xs">
            {item.movement_data?.currency?.code || "USD"}
          </div>
        );
      },
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup | TransferGroup) => {
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
        
        if ('is_transfer_group' in item) {
          return (
            <div className="text-xs space-y-1">
              <div>{item.from_wallet}</div>
              <div>{item.to_wallet}</div>
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
      render: (item: Movement | ConversionGroup | TransferGroup) => {
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
        
        if ('is_transfer_group' in item) {
          return (
            <div className="text-xs space-y-1">
              <div className="font-medium text-red-600">
                -${item.amount?.toLocaleString() || "0"}
              </div>
              <div className="font-medium text-green-600">
                +${item.amount?.toLocaleString() || "0"}
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
      key: "exchange_rate",
      label: "Cotización",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="text-xs text-muted-foreground">
              -
            </div>
          );
        }
        return (
          <span className="text-xs">
            {item.exchange_rate ? `$${item.exchange_rate?.toLocaleString()}` : "-"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      width: "8%",
      sortable: false,
      render: (item: Movement | ConversionGroup | TransferGroup) => {
        if ('is_conversion_group' in item) {
          // Actions for conversion groups
          const isGroupFavorited = item.movements.some(m => m.is_favorite);
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Toggle favorite for all movements in the group
                  item.movements.forEach(movement => {
                    handleToggleFavorite(movement);
                  });
                }}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Heart className={`w-4 h-4 ${isGroupFavorited ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditConversion(item)}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteConversion(item)}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          );
        }
        
        if ('is_transfer_group' in item) {
          // Actions for transfer groups
          const isGroupFavorited = item.movements.some(m => m.is_favorite);
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Toggle favorite for all movements in the group
                  item.movements.forEach(movement => {
                    handleToggleFavorite(movement);
                  });
                }}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Heart className={`w-4 h-4 ${isGroupFavorited ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTransfer(item)}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTransfer(item)}
                className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          );
        }
        
        // Actions for regular movements
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleFavorite(item)}
              className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(item)}
              className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item)}
              className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ], [isGeneralMode, projectsMap, handleToggleFavorite, handleEditConversion, handleDeleteConversion, handleEditTransfer, handleDeleteTransfer, handleEdit, handleDelete]);

  const headerProps = {
    title: "Movimientos",
    icon: DollarSign,
  };

  // Preparar acciones personalizadas para el ActionBar
  const customActions = [
    ...(selectedMovements.length > 0 ? [
      <Button
        key="delete-selected"
        variant="ghost"
        onClick={handleDeleteSelected}
        disabled={deleteMultipleMovementsMutation.isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Eliminar seleccionados"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ] : []),
    <CustomRestricted 
      key="import-movements"
      functionName="Importación de Excel"
      reason="general_mode"
    >
      <Button
        variant="secondary"
        onClick={() => openModal('movement-import', { projectId: selectedProjectId })}
      >
        <Upload className="mr-2 h-4 w-4" />
        Importar
      </Button>
    </CustomRestricted>
  ];

  // Detectar si hay filtros activos
  const hasActiveFilters = searchValue.trim() !== "" || 
                          filterByType !== "all" || 
                          filterByCategory !== "all" || 
                          filterBySubcategory !== "all" ||
                          filterByScope !== "all" ||
                          filterByFavorites !== "all" || 
                          filterByCurrency !== "all" ||
                          filterByWallet !== "all";

  return (
    <Layout
      headerProps={{
        title: "Movimientos",
      }}
      wide={true}
    >




      {/* ActionBarDesktopRow */}
      <ActionBarDesktopRow
        filterByType={filterByType}
        setFilterByType={setFilterByType}
        availableTypes={availableTypes}
        filterByCategory={filterByCategory}
        setFilterByCategory={setFilterByCategory}
        availableCategories={availableCategories}
        filterByFavorites={filterByFavorites}
        setFilterByFavorites={setFilterByFavorites}
        filterByCurrency={filterByCurrency}
        setFilterByCurrency={setFilterByCurrency}
        availableCurrencies={availableCurrencies}
        filterByWallet={filterByWallet}
        setFilterByWallet={setFilterByWallet}
        availableWallets={availableWallets}
        onImportClick={() => openModal('movement-import', { projectId: selectedProjectId })}
        onNewMovementClick={() => openModal('movement')}
        customRestricted={
          <CustomRestricted 
            functionName="Importación de Excel"
            reason="general_mode"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal('movement-import', { projectId: selectedProjectId })}
              className="h-8 px-3 text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Importar
            </Button>
          </CustomRestricted>
        }
      />
      
      {/* Cards de resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Resumen General */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-[var(--text-card-title)] mb-3">Resumen</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 dark:text-green-400">Ingresos</span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    filteredMovements
                      .filter(m => m.movement_data?.type?.name === 'Ingresos')
                      .reduce((sum, m) => sum + (m.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-600 dark:text-red-400">Egresos</span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(
                    filteredMovements
                      .filter(m => m.movement_data?.type?.name === 'Egresos')
                      .reduce((sum, m) => sum + (m.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--menues-border)]">
                <span className="text-xs font-medium">Balance</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(
                    filteredMovements
                      .filter(m => m.movement_data?.type?.name === 'Ingresos')
                      .reduce((sum, m) => sum + (m.amount || 0), 0) -
                    filteredMovements
                      .filter(m => m.movement_data?.type?.name === 'Egresos')
                      .reduce((sum, m) => sum + (m.amount || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Por Moneda */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-[var(--text-card-title)] mb-3">Por Moneda</h3>
            <div className="space-y-2">
              {availableCurrencies.map((currency) => {
                const currencyMovements = filteredMovements.filter(m => m.movement_data?.currency?.name === currency);
                const currencyBalance = currencyMovements
                  .filter(m => m.movement_data?.type?.name === 'Ingresos')
                  .reduce((sum, m) => sum + (m.amount || 0), 0) -
                  currencyMovements
                  .filter(m => m.movement_data?.type?.name === 'Egresos')
                  .reduce((sum, m) => sum + (m.amount || 0), 0);
                
                return (
                  <div key={currency} className="flex items-center justify-between">
                    <span className="text-xs font-medium">{currency}</span>
                    <span className={`text-xs font-semibold ${currencyBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(currencyBalance)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Por Billetera con Monedas */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-[var(--text-card-title)] mb-3">Por Billetera</h3>
            <div className="space-y-3">
              {availableWallets.map((wallet) => {
                // Obtener todas las monedas para esta billetera
                const walletCurrenciesSet = new Set(
                  filteredMovements
                    .filter(m => m.movement_data?.wallet?.name === wallet)
                    .map(m => m.movement_data?.currency?.name)
                    .filter(Boolean)
                );
                const walletCurrencies = Array.from(walletCurrenciesSet);

                return (
                  <div key={wallet} className="space-y-1">
                    <h4 className="text-xs font-medium text-[var(--secondary-card-fg)]">{wallet}</h4>
                    <div className="space-y-1 pl-2">
                      {walletCurrencies.map((currency) => {
                        const walletCurrencyMovements = filteredMovements.filter(
                          m => m.movement_data?.wallet?.name === wallet && 
                               m.movement_data?.currency?.name === currency
                        );
                        const balance = walletCurrencyMovements
                          .filter(m => m.movement_data?.type?.name === 'Ingresos')
                          .reduce((sum, m) => sum + (m.amount || 0), 0) -
                          walletCurrencyMovements
                          .filter(m => m.movement_data?.type?.name === 'Egresos')
                          .reduce((sum, m) => sum + (m.amount || 0), 0);

                        return (
                          <div key={`${wallet}-${currency}`} className="flex items-center justify-between">
                            <span className="text-xs text-[var(--secondary-card-fg)]">{currency}</span>
                            <span className={`text-xs font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(balance)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Table
        columns={tableColumns}
        data={processedMovements}
        isLoading={isLoading}
        selectable={true}
        defaultSort={{
          key: "movement_date",
          direction: "desc",
        }}

        getRowClassName={(item: Movement | ConversionGroup | TransferGroup) => {
          if ('is_conversion_group' in item) {
            return "movement-row-conversion";
          }
          
          if ('is_transfer_group' in item) {
            return "movement-row-transfer";
          }
          
          // For regular movements, determine type
          const typeName = item.movement_data?.type?.name || "";
          const categoryName = item.movement_data?.category?.name || "";
          
          // Check for APORTES PROPIOS and RETIROS PROPIOS based on category name
          if (categoryName.toLowerCase().includes("aportes propios") || 
              categoryName.toLowerCase().includes("aportes_propios")) {
            return "movement-row-aportes-propios";
          } else if (categoryName.toLowerCase().includes("retiros propios") || 
                     categoryName.toLowerCase().includes("retiros_propios")) {
            return "movement-row-retiros-propios";
          }
          
          if (typeName === "Ingresos" || typeName.toLowerCase().includes("ingreso")) {
            return "movement-row-income";
          } else if (typeName === "Egresos" || typeName.toLowerCase().includes("egreso")) {
            return "movement-row-expense";
          }
          return "";
        }}
        selectedItems={selectedMovements}
        onSelectionChange={(items) => {
          // Only allow selection of regular movements, not group objects
          const regularMovements = items.filter(item => 
            !('is_conversion_group' in item) && !('is_transfer_group' in item)
          ) as Movement[];
          setSelectedMovements(regularMovements);
        }}
        getItemId={(item) => item.id}
        renderCard={(item: Movement | ConversionGroup | TransferGroup) => {
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
          } else if ('is_transfer_group' in item) {
            // Render TransferCard for transfer groups
            return (
              <TransferCard
                transfer={item}
                onEdit={handleEditTransfer}
                onDelete={handleDeleteTransfer}
                onToggleFavorite={(transferGroup) => {
                  // Toggle favorite for all movements in the group
                  transferGroup.movements.forEach(movement => {
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
        emptyState={
          <EmptyState
            icon={<DollarSign className="h-12 w-12" />}
            title="No hay movimientos registrados"
            description="Crea el primer movimiento del proyecto"
          />
        }
      />

      {/* Modal Factory will handle the movement modal */}





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
