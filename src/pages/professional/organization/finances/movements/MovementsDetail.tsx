import { useState, useMemo, useEffect } from 'react'
import { DollarSign, Plus, Search, X, Heart, Pencil, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table, ProjectBadge } from '@/components/ui-custom/tables-and-trees/Table'
import { useMovements } from '@/hooks/use-movements'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useMobile } from '@/hooks/use-mobile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MovementKPICardsWithWallets } from '@/components/kpis/MovementKPICardsWithWallets'
import { MovementRow } from '@/components/data-row/finances/MovementRow'
import { ConversionRow } from '@/components/data-row/finances/ConversionRow'
import { TransferRow } from '@/components/data-row/finances/TransferRow'
import { SwipeableCard } from '@/components/ui-custom/cards/SwipeableCard'
import { format } from 'date-fns'
import type { Movement, ConversionGroup, TransferGroup } from '@/lib/types'

export default function MovementsDetail() {
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const isMobile = useMobile()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // State for filters
  const [searchValue, setSearchValue] = useState("")
  const [filterByType, setFilterByType] = useState("all")
  const [filterByCategory, setFilterByCategory] = useState("all")
  const [filterBySubcategory, setFilterBySubcategory] = useState("all")
  const [filterByFavorites, setFilterByFavorites] = useState("all")
  const [filterByCurrency, setFilterByCurrency] = useState("all")
  const [filterByWallet, setFilterByWallet] = useState("all")
  const [selectedMovements, setSelectedMovements] = useState<Movement[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Get movements data
  const { data: movements = [], isLoading } = useMovements(
    organizationId || '',
    projectId || ''
  )

  // Basic grouping function for movements
  const groupConversions = (movements: Movement[]): (Movement | ConversionGroup | TransferGroup)[] => {
    // For now, return movements as is - can be enhanced later
    return movements.sort((a, b) => {
      const dateA = new Date(a.movement_date);
      const dateB = new Date(b.movement_date);
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Apply filters to movements
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Apply basic search filter
    if (searchValue) {
      filtered = filtered.filter(m => 
        m.description?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        m.movement_data?.category?.name?.toLowerCase()?.includes(searchValue.toLowerCase())
      );
    }

    return groupConversions(filtered);
  }, [movements, searchValue]);

  // Basic table columns
  const columns = [
    {
      key: 'movement',
      label: 'Movimiento',
      width: 'auto',
      render: (item: Movement) => {
        return (
          <div className="p-3 border rounded-lg">
            <div className="text-sm font-medium">{item.description}</div>
            <div className="text-xs text-muted-foreground">
              ${item.amount?.toLocaleString()} - {item.movement_data?.category?.name}
            </div>
          </div>
        );
      },
    },
  ];

  if (!organizationId) {
    return (
      <EmptyState
        icon={<DollarSign className="h-12 w-12" />}
        title="Organización no encontrada"
        description="Selecciona una organización para ver los movimientos."
      />
    );
  }

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Cargando movimientos...</div>
          </div>
        </div>
      ) : filteredMovements.length === 0 ? (
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
      ) : (
        <>
          {/* Movement KPIs */}
          <MovementKPICardsWithWallets 
            organizationId={organizationId} 
            projectId={projectId || undefined} 
          />

          {/* Simple search bar */}
          <div className="p-4 border-b">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Buscar
              </Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* Movements list */}
          <div className="space-y-2 p-4">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="p-3 border rounded-lg">
                <div className="text-sm font-medium">{movement.description}</div>
                <div className="text-xs text-muted-foreground">
                  ${movement.amount?.toLocaleString()} - {movement.movement_data?.category?.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}