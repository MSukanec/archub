import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DollarSign, Plus, Edit, Trash2, Heart, Search, Filter, X, Pencil, Upload, Wallet, Home, Bell } from "lucide-react";
import { formatDate } from "@/lib/date-utils";


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

import { Table, ProjectBadge } from "@/components/ui-custom/tables-and-trees/Table";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";

import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";

import { TransferGroup } from "@/components/ui/data-row";
import { MovementRow, ConversionRow, TransferRow } from "@/components/ui/data-row";
import SwipeableCard from "@/components/layout/mobile/SwipeableCard";
import { Star } from "lucide-react";

import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMovements, useToggleMovementFavorite } from "@/hooks/use-movements";
import { useOrganizationDefaultCurrency, useOrganizationCurrencies } from "@/hooks/use-currencies";
import { useOrganizationWallets } from "@/hooks/use-organization-wallets";
import { useNavigationStore } from "@/stores/navigationStore";
import { useProjectsMap } from "@/hooks/use-projects";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useActionBarMobile } from "@/components/layout/mobile/ActionBarMobileContext";
import { useMobile } from "@/hooks/use-mobile";
import { useProjectContext } from "@/stores/projectContext";
import { FILTER_LABELS } from "@/constants/actionBarConstants";
import { MovementKPICardsWithWallets } from "@/components/kpis/MovementKPICardsWithWallets";

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
  project_name?: string;
  project_color?: string;
  currency_name?: string;
  currency_symbol?: string;
  currency_code?: string;
  currency_country?: string;
  wallet_name?: string;
  type_name?: string;
  category_name?: string;
  subcategory_name?: string;
  partner?: string;
  subcontract?: string;
  client?: string;
  member?: string;
  member_avatar?: string;
  personnel?: string;  // Nuevo campo agregado a la vista
  indirect?: string;
  general_cost?: string;
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
      symbol?: string;
    };
    wallet?: {
      id: string;
      name: string;
    };
  };
  creator?: {
    full_name?: string;
    avatar_url?: string;
  } | {
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

export default function MovementsList() {
  const [, navigate] = useLocation();
  
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


  const { 
    setActions, 
    setShowActionBar, 
    clearActions, 
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile();
  const isMobile = useMobile();


  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);



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
  const { selectedProjectId, isGlobalView, currentOrganizationId } = useProjectContext();
  // Usar ProjectContext como fuente única de verdad para org/project IDs
  const organizationId = currentOrganizationId || undefined;
  const projectId = selectedProjectId;

  const { data: rawMovements = [], isLoading } = useMovements(
    organizationId,
    undefined, // No filtrar por proyecto - mostrar todos los movimientos de la organización
  );

  // Safe movements with defensive checks
  const movements = useMemo(() => {
    return rawMovements.filter(movement => 
      movement && 
      movement.id &&
      movement.movement_data &&
      typeof movement.movement_data === 'object'
    );
  }, [rawMovements]);

  // Get organization's default currency
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  
  // Get organization currencies and wallets for filters
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);
  const { data: organizationWallets = [] } = useOrganizationWallets(organizationId);
  
  // Get projects map for the project badges (only when in GENERAL mode)
  const { data: projectsMap = {} } = useProjectsMap(organizationId);
  
  // En página organizacional siempre mostrar columna proyecto
  const isGeneralMode = true;

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
      // Invalidate movements queries
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      
      // Invalidate client payment commitment queries
      queryClient.invalidateQueries({ queryKey: ["client-monthly-installments"] });
      queryClient.invalidateQueries({ queryKey: ["project-installments"] });
      queryClient.invalidateQueries({ queryKey: ["movement-clients"] });
      queryClient.invalidateQueries({ queryKey: ["project-payment-plan"] });
      queryClient.invalidateQueries({ queryKey: ["movement-project-clients"] });
      
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
      // Invalidate movements queries
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      
      // Invalidate client payment commitment queries
      queryClient.invalidateQueries({ queryKey: ["client-monthly-installments"] });
      queryClient.invalidateQueries({ queryKey: ["project-installments"] });
      queryClient.invalidateQueries({ queryKey: ["movement-clients"] });
      queryClient.invalidateQueries({ queryKey: ["project-payment-plan"] });
      queryClient.invalidateQueries({ queryKey: ["movement-project-clients"] });
      
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

  const handleView = (movement: Movement) => {
    openModal('movements-view', { viewingMovement: movement });
  };

  const handleEditConversion = (conversionGroup: ConversionGroup) => {
    // For conversions, we need to set special data so the modal can handle it
    const egresoMovement = conversionGroup.movements.find(m => 
      m.movement_data?.type?.name?.toLowerCase()?.includes('egreso')
    ) || conversionGroup.movements[0];
    
    // Add conversion metadata to the movement
    const conversionMovement = {
      ...egresoMovement,
      _isConversion: true,
      _conversionData: conversionGroup
    };
    
    openModal('movement', { editingMovement: conversionMovement as any });
  };

  const handleViewConversion = (conversionGroup: ConversionGroup) => {
    // Find the first egreso movement as main data
    const egresoMovement = conversionGroup.movements.find(m => m.amount < 0);
    if (!egresoMovement) return;
    
    // Add conversion metadata to the movement
    const conversionMovement = {
      ...egresoMovement,
      _isConversion: true,
      _conversionData: conversionGroup
    };
    
    openModal('movements-view', { viewingMovement: conversionMovement as any });
  };

  const handleEditTransfer = (transferGroup: TransferGroup) => {
    // For transfers, we need to set special data so the modal can handle it
    const egresoMovement = transferGroup.movements.find(m => 
      m.movement_data?.type?.name?.toLowerCase()?.includes('egreso')
    ) || transferGroup.movements[0];
    
    // Add transfer metadata to the movement
    const transferMovement = {
      ...egresoMovement,
      _isTransfer: true,
      _transferData: transferGroup
    };
    
    openModal('movement', { editingMovement: transferMovement as any });
  };

  const handleViewTransfer = (transferGroup: TransferGroup) => {
    // Find the first egreso movement as main data
    const egresoMovement = transferGroup.movements.find(m => m.amount < 0);
    if (!egresoMovement) return;
    
    // Add transfer metadata to the movement
    const transferMovement = {
      ...egresoMovement,
      _isTransfer: true,
      _transferData: transferGroup
    };
    
    openModal('movements-view', { viewingMovement: transferMovement as any });
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
  const availableTypes = useMemo(() => Array.from(
    new Set(movements.map((m) => m.movement_data?.type?.name).filter(Boolean)),
  ), [movements]);

  const availableCategories = useMemo(() => Array.from(
    new Set(
      movements.map((m) => m.movement_data?.category?.name).filter(Boolean),
    ),
  ), [movements]);



  const availableSubcategories = useMemo(() => Array.from(
    new Set(
      movements.map((m) => m.movement_data?.subcategory?.name).filter(Boolean),
    ),
  ), [movements]);

  // Get subcategories filtered by selected category
  const getSubcategoriesForCategory = (categoryName: string) => {
    if (categoryName === 'all') return [];
    
    return Array.from(
      new Set(
        movements
          .filter(m => m.movement_data?.category?.name === categoryName)
          .map(m => m.movement_data?.subcategory?.name)
          .filter(Boolean)
      )
    );
  };

  const filteredSubcategories = getSubcategoriesForCategory(filterByCategory);

  const availableCurrencies = useMemo(() => Array.from(
    new Set(
      movements.map((m) => m.movement_data?.currency?.name).filter(Boolean),
    ),
  ), [movements]);

  const availableWallets = useMemo(() => Array.from(
    new Set(
      movements.map((m) => m.movement_data?.wallet?.name).filter(Boolean),
    ),
  ), [movements]);

  // Configure mobile action bar - separate into setup and config updates
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nuevo Movimiento',
          onClick: () => openModal('movement'),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      });
      setShowActionBar(true);
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile, navigate, setActions, setShowActionBar, clearActions, openModal]); // Include all dependencies

  // Separate effect for filter configuration to avoid loops
  useEffect(() => {
    if (isMobile && availableTypes.length > 0) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por tipo',
            value: filterByType,
            onChange: setFilterByType,
            placeholder: 'Todos los tipos',
            allOptionLabel: 'Todos los tipos',
            options: availableTypes.map(type => ({ value: type!, label: type! }))
          },
          {
            label: 'Filtrar por categoría',
            value: filterByCategory,
            onChange: setFilterByCategory,
            placeholder: 'Todas las categorías',
            allOptionLabel: 'Todas las categorías',
            options: availableCategories.map(category => ({ value: category!, label: category! }))
          },
          {
            label: 'Filtrar por subcategoría',
            value: filterBySubcategory,
            onChange: setFilterBySubcategory,
            placeholder: 'Todas las subcategorías',
            allOptionLabel: 'Todas las subcategorías',
            options: availableSubcategories
              .filter(subcategory => {
                if (filterByCategory === "all") return true;
                const relevantMovements = movements.filter(m => 
                  m.movement_data?.category?.name === filterByCategory
                );
                return relevantMovements.some(m => 
                  m.movement_data?.subcategory?.name === subcategory
                );
              })
              .map(subcategory => ({ value: subcategory!, label: subcategory! }))
          },
          {
            label: 'Filtrar por moneda',
            value: filterByCurrency,
            onChange: setFilterByCurrency,
            placeholder: 'Todas las monedas',
            allOptionLabel: 'Todas las monedas',
            options: availableCurrencies.map(currency => ({ value: currency!, label: currency! }))
          },
          {
            label: 'Filtrar por billetera',
            value: filterByWallet,
            onChange: setFilterByWallet,
            placeholder: 'Todas las billeteras',
            allOptionLabel: 'Todas las billeteras',
            options: availableWallets.map(wallet => ({ value: wallet!, label: wallet! }))
          }
        ],
        onClearFilters: () => {
          setSearchValue("");
          setMobileSearchValue("");
          setFilterByType("all");
          setFilterByCategory("all");
          setFilterBySubcategory("all");
          setFilterByScope("all");
          setFilterByFavorites("all");
          setFilterByCurrency("all");
          setFilterByWallet("all");
        }
      });
    }
  }, [filterByType, filterByCategory, filterBySubcategory, filterByCurrency, filterByWallet, availableTypes, availableCategories, availableSubcategories, availableCurrencies, availableWallets, isMobile]);



  // Group movements by conversion_group_id
  const groupConversions = (movements: Movement[]): (Movement | ConversionGroup | TransferGroup)[] => {
    const conversionGroups = new Map<string, Movement[]>();
    const transferGroups = new Map<string, Movement[]>();
    const regularMovements: Movement[] = [];

    // First pass - group by conversion_group_id and transfer_group_id
    movements.forEach(movement => {
      if (movement.conversion_group_id) {
        if (!conversionGroups.has(movement.conversion_group_id)) {
          conversionGroups.set(movement.conversion_group_id, []);
        }
        conversionGroups.get(movement.conversion_group_id)?.push(movement);
      } else if (movement.transfer_group_id) {
        if (!transferGroups.has(movement.transfer_group_id)) {
          transferGroups.set(movement.transfer_group_id, []);
        }
        transferGroups.get(movement.transfer_group_id)?.push(movement);
      } else {
        regularMovements.push(movement);
      }
    });

    // Build result array with grouped conversions and transfers
    const result: (Movement | ConversionGroup | TransferGroup)[] = [...regularMovements];

    // Add conversion groups
    conversionGroups.forEach((groupMovements, groupId) => {
      if (groupMovements.length === 2) {
        // Find the egreso and ingreso movements by type_name instead of amount
        const egresoMovement = groupMovements.find(m => m.type_name === 'Egresos');
        const ingresoMovement = groupMovements.find(m => m.type_name === 'Ingresos');
        
        if (egresoMovement && ingresoMovement) {
          const conversionGroup: ConversionGroup = {
            id: groupId,
            conversion_group_id: groupId,
            movements: groupMovements,
            from_currency: egresoMovement.movement_data?.currency?.code || '',
            to_currency: ingresoMovement.movement_data?.currency?.code || '',
            from_amount: egresoMovement.amount,
            to_amount: ingresoMovement.amount,
            description: egresoMovement.description,
            movement_date: egresoMovement.movement_date,
            created_at: egresoMovement.created_at,
            creator: egresoMovement.creator,
            is_conversion_group: true
          };
          result.push(conversionGroup);
        }
      }
    });

    // Add transfer groups
    transferGroups.forEach((groupMovements, groupId) => {
      if (groupMovements.length === 2) {
        // Find the egreso and ingreso movements by type_name
        const egresoMovement = groupMovements.find(m => m.type_name === 'Egresos');
        const ingresoMovement = groupMovements.find(m => m.type_name === 'Ingresos');
        
        if (egresoMovement && ingresoMovement) {
          const transferGroup: TransferGroup = {
            id: groupId,
            transfer_group_id: groupId,
            movements: groupMovements,
            from_wallet: egresoMovement.movement_data?.wallet?.name || '',
            to_wallet: ingresoMovement.movement_data?.wallet?.name || '',
            amount: egresoMovement.amount,
            description: egresoMovement.description,
            movement_date: egresoMovement.movement_date,
            created_at: egresoMovement.created_at,
            creator: egresoMovement.creator,
            is_transfer_group: true
          };
          result.push(transferGroup);
        }
      }
    });

    // Sort by movement_date descending
    return result.sort((a, b) => {
      const dateA = new Date(a.movement_date);
      const dateB = new Date(b.movement_date);
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Apply filters to grouped items
  const processedMovements = useMemo(() => {
    let filtered = movements;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(m => 
        m.description?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        m.movement_data?.category?.name?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        m.movement_data?.subcategory?.name?.toLowerCase()?.includes(searchValue.toLowerCase())
      );
    }

    // Apply filters
    if (filterByType !== "all") {
      filtered = filtered.filter(m => m.movement_data?.type?.name === filterByType);
    }

    if (filterByCategory !== "all") {
      filtered = filtered.filter(m => m.movement_data?.category?.name === filterByCategory);
    }

    if (filterBySubcategory !== "all") {
      filtered = filtered.filter(m => m.movement_data?.subcategory?.name === filterBySubcategory);
    }

    if (filterByFavorites !== "all") {
      if (filterByFavorites === "favorites") {
        filtered = filtered.filter(m => m.is_favorite);
      } else if (filterByFavorites === "non-favorites") {
        filtered = filtered.filter(m => !m.is_favorite);
      }
    }

    if (filterByCurrency !== "all") {
      filtered = filtered.filter(m => m.movement_data?.currency?.name === filterByCurrency);
    }

    if (filterByWallet !== "all") {
      filtered = filtered.filter(m => m.movement_data?.wallet?.name === filterByWallet);
    }

    return groupConversions(filtered);
  }, [
    movements,
    searchValue,
    filterByType,
    filterByCategory,
    filterBySubcategory,
    filterByFavorites,
    filterByCurrency,
    filterByWallet,
  ]);


  // Set sidebar context to project when component mounts
  const { setSidebarContext } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);



  const tableColumns = useMemo(() => {
    // Lógica condicional para mostrar columnas
    const hasMultipleCurrencies = organizationCurrencies.length > 1
    const hasMultipleWallets = organizationWallets.length > 1
    const isTeamsPlan = userData?.plan?.name === "Teams"
    
    return [
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
      key: "date_creator",
      label: isTeamsPlan ? "Fecha / Creador" : "Fecha",
      width: "10%",
      sortable: true,
      sortType: "date" as const,
      render: (item: Movement | ConversionGroup) => {
        const displayDate = item.movement_date;

        // Formatear fecha
        let dateElement;
        if (!displayDate) {
          dateElement = <div className="text-xs text-muted-foreground">Sin fecha</div>;
        } else {
          try {
            dateElement = <div className="text-xs font-medium">{formatDate(displayDate)}</div>;
          } catch (error) {
            dateElement = <div className="text-xs text-muted-foreground">Fecha inválida</div>;
          }
        }

        // Solo mostrar creador en planes TEAMS
        const creatorElement = isTeamsPlan ? (
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.creator?.avatar_url} />
              <AvatarFallback className="text-xs">
                {item.creator?.full_name?.charAt(0) ||
                  item.creator?.email?.charAt(0) ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {item.creator?.full_name || 
               item.creator?.email || 
               "Usuario"}
            </span>
          </div>
        ) : null;

        return (
          <div className="py-1">
            {dateElement}
            {creatorElement}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Tipo",
      width: "8%",
      sortable: true,
      sortType: "string" as const,
      render: (item: Movement | ConversionGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-gray-900">
                Conversión
              </div>
              <div className="text-xs text-gray-600">
                {item.from_currency} → {item.to_currency}
              </div>
            </div>
          );
        }
        
        if ('is_transfer_group' in item) {
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-gray-900">
                Transferencia
              </div>
            </div>
          );
        }
        
        const movement = item as Movement;
        const typeName = movement.movement_data?.type?.name || "Sin tipo";
        const categoryName = movement.movement_data?.category?.name || movement.category_name || "";
        
        
        // Determinar el valor seleccionado basado en la categoría específica (solo si corresponde)
        let selectedValue = "";
        const categoryId = movement.category_id || movement.subcategory_id; // Usar subcategory_id si category_id es null (migración)
        
        // Solo mostrar datos específicos según UUIDs exactos
        if (categoryId === 'f3b96eda-15d5-4c96-ade7-6f53685115d3' && movement.client && movement.client.trim() !== "") {
          // Aportes de Clientes
          selectedValue = movement.client;
        } else if (categoryId === 'f40a8fda-69e6-4e81-bc8a-464359cd8498' && movement.subcontract && movement.subcontract.trim() !== "") {
          // Subcontratos
          selectedValue = movement.subcontract;
        } else if (categoryId === 'd376d404-734a-47a9-b851-d112d64147db' && movement.personnel && movement.personnel.trim() !== "") {
          // Mano de Obra (Personal) - usar PERSONNEL en lugar de member (creador)
          selectedValue = movement.personnel;
        } else if ((categoryId === 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' || categoryId === 'c04a82f8-6fd8-439d-81f7-325c63905a1b') && movement.partner && movement.partner.trim() !== "") {
          // Aportes Propios o Retiros Propios
          selectedValue = movement.partner;
        } else if (categoryId === 'e854de08-da8f-4769-a2c5-b24b622f20b0' && movement.indirect && movement.indirect.trim() !== "") {
          // Indirectos
          selectedValue = movement.indirect;
        } else if (categoryId === '0ec4814c-40f6-49f3-8a34-0c350a122bad' && movement.general_cost && movement.general_cost.trim() !== "") {
          // Gastos Generales
          selectedValue = movement.general_cost;
        }
        
        return (
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-gray-900">
              {typeName}
            </div>
            {categoryName && (
              <div className="text-xs text-gray-600">
                {categoryName}
              </div>
            )}
            {selectedValue && (
              <div className="text-xs text-gray-500 truncate max-w-[120px]" title={selectedValue}>
                {selectedValue}
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
      render: (item: Movement | ConversionGroup | TransferGroup) => {
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
                Transferencia
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
    // Columna "Moneda" - solo visible si hay múltiples monedas
    ...(hasMultipleCurrencies ? [{
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
    }] : []),
    // Columna "Billetera" - solo visible si hay múltiples billeteras
    ...(hasMultipleWallets ? [{
      key: "wallet",
      label: "Billetera",
      width: "5%",
      sortable: false,
      render: (item: Movement | ConversionGroup | TransferGroup) => {
        if ('is_conversion_group' in item) {
          const egresoMovement = item.movements.find(m => 
            m.movement_data?.type?.name?.toLowerCase()?.includes('egreso')
          );
          const ingresoMovement = item.movements.find(m => 
            m.movement_data?.type?.name?.toLowerCase()?.includes('ingreso')
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
    }] : []),
    {
      key: "amount",
      label: "Cantidad",
      width: "5%",
      sortable: true,
      sortType: "number" as const,
      render: (item: Movement | ConversionGroup | TransferGroup) => {
        if ('is_conversion_group' in item) {
          return (
            <div className="text-xs space-y-1 text-right">
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
            <div className="text-xs space-y-1 text-right">
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
          <div className="text-right">
            <div className="text-xs font-medium">
              ${item.amount?.toLocaleString() || "0"}
            </div>
            {item.exchange_rate && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                (Cot. ${item.exchange_rate?.toLocaleString()})
              </div>
            )}
          </div>
        );
      },
    },
  ];
}, [isGeneralMode, projectsMap, handleToggleFavorite, handleEditConversion, handleDeleteConversion, handleEditTransfer, handleDeleteTransfer, handleEdit, handleDelete, organizationCurrencies, organizationWallets, userData?.plan?.name]);

  const getRowActions = useCallback((item: Movement | ConversionGroup | TransferGroup) => {
    if ('is_conversion_group' in item) {
      return [
        {
          label: 'Favorito',
          icon: Heart,
          onClick: () => {
            item.movements.forEach(movement => {
              handleToggleFavorite(movement);
            });
          }
        },
        {
          label: 'Editar',
          icon: Pencil,
          onClick: () => handleEditConversion(item)
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => handleDeleteConversion(item),
          variant: 'destructive' as const
        }
      ];
    }
    
    if ('is_transfer_group' in item) {
      return [
        {
          label: 'Favorito',
          icon: Heart,
          onClick: () => {
            item.movements.forEach(movement => {
              handleToggleFavorite(movement);
            });
          }
        },
        {
          label: 'Editar',
          icon: Pencil,
          onClick: () => handleEditTransfer(item)
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => handleDeleteTransfer(item),
          variant: 'destructive' as const
        }
      ];
    }
    
    return [
      {
        label: 'Favorito',
        icon: Heart,
        onClick: () => handleToggleFavorite(item)
      },
      {
        label: 'Editar',
        icon: Pencil,
        onClick: () => handleEdit(item)
      },
      {
        label: 'Eliminar',
        icon: Trash2,
        onClick: () => handleDelete(item),
        variant: 'destructive' as const
      }
    ];
  }, [handleToggleFavorite, handleEditConversion, handleDeleteConversion, handleEditTransfer, handleDeleteTransfer, handleEdit, handleDelete]);



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
    <>
      {/* Solo mostrar contenido si no está cargando */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Cargando movimientos...</div>
          </div>
        </div>
      ) : processedMovements.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <EmptyState
            icon={<DollarSign className="h-12 w-12" />}
            title="No hay movimientos registrados"
            description="Crea el primer movimiento del proyecto"
            action={
              <Button 
                onClick={() => openModal("movement")}
                className="w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Movement KPIs - Solo mostrar cuando hay datos */}
          {/* Solo mostrar balance de organización, no del proyecto */}
          <MovementKPICardsWithWallets 
            organizationId={organizationId}
          />
          <Table
            columns={tableColumns}
            data={processedMovements}
            isLoading={false} // Ya no está cargando cuando llegamos aquí
            selectable={true}
          defaultSort={{
            key: "movement_date",
            direction: "desc",
          }}
          rowActions={getRowActions}
          topBar={{
            showSearch: true,
            searchValue: searchValue,
            onSearchChange: setSearchValue,
            showFilter: true,
            isFilterActive: filterByType !== 'all' || filterByCategory !== 'all' || filterBySubcategory !== 'all' || filterByFavorites !== 'all' || filterByCurrency !== 'all' || filterByWallet !== 'all',
            renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Tipo</Label>
                <Select value={filterByType} onValueChange={setFilterByType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="Ingresos">Ingresos</SelectItem>
                    <SelectItem value="Egresos">Egresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Categoría</Label>
                <Select value={filterByCategory} onValueChange={(value) => {
                  setFilterByCategory(value);
                  if (value === 'all') setFilterBySubcategory('all');
                }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {availableCategories.filter(Boolean).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Subcategoría</Label>
                <Select 
                  value={filterBySubcategory} 
                  onValueChange={setFilterBySubcategory}
                  disabled={filterByCategory === 'all'}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las subcategorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las subcategorías</SelectItem>
                    {filteredSubcategories.filter(Boolean).map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                    {filteredSubcategories.length === 0 && filterByCategory !== 'all' && (
                      <SelectItem value="no-subcategories" disabled>
                        Sin subcategorías disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Favoritos</Label>
                <Select value={filterByFavorites} onValueChange={setFilterByFavorites}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="favorites">Solo favoritos</SelectItem>
                    <SelectItem value="non-favorites">No favoritos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Moneda</Label>
                <Select value={filterByCurrency} onValueChange={setFilterByCurrency}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las monedas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las monedas</SelectItem>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Billetera</Label>
                <Select value={filterByWallet} onValueChange={setFilterByWallet}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las billeteras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las billeteras</SelectItem>
                    {availableWallets.map((wallet) => (
                      <SelectItem key={wallet} value={wallet}>
                        {wallet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
          showSort: false,
          onClearFilters: () => {
            setSearchValue("");
            setFilterByType("all");
            setFilterByCategory("all");
            setFilterBySubcategory("all");
            setFilterByFavorites("all");
            setFilterByCurrency("all");
            setFilterByWallet("all");
          },
          showImport: true,
          onImport: () => openModal('movement-import', { projectId: selectedProjectId }),
          customActions: selectedMovements.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteMultipleMovementsMutation.isPending}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Eliminar seleccionados"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">Eliminar</span>
            </Button>
          )
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
          const subcategoryName = item.movement_data?.subcategory?.name || "";
          
          // Check for deprecated concepts (old patterns) - both in category and subcategory names
          const isDeprecatedAportes = (categoryName.toLowerCase().includes("aportes propios") || 
                                      categoryName.toLowerCase().includes("aportes_propios") ||
                                      subcategoryName.toLowerCase().includes("aportes propios") || 
                                      subcategoryName.toLowerCase().includes("aportes_propios") ||
                                      subcategoryName.toLowerCase().includes("aportes de socios") ||
                                      categoryName.toLowerCase().includes("aportes de socios"));
          
          const isDeprecatedRetiros = (categoryName.toLowerCase().includes("retiros propios") || 
                                      categoryName.toLowerCase().includes("retiros_propios") ||
                                      subcategoryName.toLowerCase().includes("retiros propios") || 
                                      subcategoryName.toLowerCase().includes("retiros_propios") ||
                                      subcategoryName.toLowerCase().includes("retiros de socios") ||
                                      categoryName.toLowerCase().includes("retiros de socios"));
          
          if (isDeprecatedAportes) {
            return "movement-row-aportes-propios";
          } else if (isDeprecatedRetiros) {
            return "movement-row-retiros-propios";
          }
          
          if (typeName && (typeName === "Ingresos" || typeName.toLowerCase().includes("ingreso"))) {
            return "movement-row-income";
          } else if (typeName && (typeName === "Egresos" || typeName.toLowerCase().includes("egreso"))) {
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
        renderCard={(item: any) => {
          if ('is_conversion_group' in item) {
            // Render ConversionRow with SwipeableCard for conversion groups
            return (
              <SwipeableCard
                actions={[
                  {
                    label: "Favorito",
                    icon: <Star className="w-4 h-4" />,
                    onClick: () => {
                      // Toggle favorite for all movements in the group
                      item.movements.forEach((movement: any) => {
                        handleToggleFavorite(movement);
                      });
                    }
                  },
                  {
                    label: "Editar",
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleEditConversion(item)
                  },
                  {
                    label: "Eliminar",
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDeleteConversion(item)
                  }
                ]}
              >
                <ConversionRow
                  conversion={item}
                  onClick={() => handleViewConversion(item)}
                  density="normal"
                />
              </SwipeableCard>
            );
          } else if ('is_transfer_group' in item) {
            // Render TransferRow with SwipeableCard for transfer groups
            return (
              <SwipeableCard
                actions={[
                  {
                    label: "Favorito",
                    icon: <Star className="w-4 h-4" />,
                    onClick: () => {
                      // Toggle favorite for all movements in the group
                      item.movements.forEach((movement: any) => {
                        handleToggleFavorite(movement);
                      });
                    }
                  },
                  {
                    label: "Editar",
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleEditTransfer(item)
                  },
                  {
                    label: "Eliminar",
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDeleteTransfer(item)
                  }
                ]}
              >
                <TransferRow
                  transfer={item}
                  onClick={() => handleViewTransfer(item)}
                  density="normal"
                />
              </SwipeableCard>
            );
          } else {
            // Render MovementRow with SwipeableCard for regular movements
            return (
              <SwipeableCard
                actions={[
                  {
                    label: "Favorito",
                    icon: <Star className="w-4 h-4" />,
                    onClick: () => handleToggleFavorite(item)
                  },
                  {
                    label: "Editar",
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleEdit(item)
                  },
                  {
                    label: "Eliminar",
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(item)
                  }
                ]}
              >
                <MovementRow
                  movement={item}
                  showProject={isGlobalView}
                  onClick={() => handleView(item)}
                  density="normal"
                />
              </SwipeableCard>
            );
          }
        }}
          />
        </>
      )}

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
    </>
  );
}