import React from 'react'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, Edit, Trash2, FileText, Calendar, User, Building, Wallet, DollarSign, Hash, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MovementModalViewProps {
  modalData?: {
    viewingMovement?: any;
  };
  onClose: () => void;
  onEdit?: (movement: any) => void;
  onDelete?: (movement: any) => void;
}

export function MovementModalView({ modalData, onClose, onEdit, onDelete }: MovementModalViewProps) {
  const movement = modalData?.viewingMovement
  const { openModal } = useGlobalModalStore()
  
  if (!movement) {
    return null
  }

  // Handler para abrir el modal de edición
  const handleEdit = () => {
    onClose() // Cerrar el modal de vista primero
    if (movement._isConversion) {
      openModal('movement', { editingMovement: movement })
    } else if (movement._isTransfer) {
      openModal('movement', { editingMovement: movement })
    } else {
      openModal('movement', { editingMovement: movement })
    }
  }

  // Helper para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

  // Helper para formatear monto
  const formatAmount = (amount: number, currencySymbol?: string) => {
    const symbol = currencySymbol || '$'
    return `${symbol} ${Math.abs(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Determinar tipo de movimiento y color
  const getMovementTypeInfo = () => {
    if (movement._isConversion) {
      return { type: 'Conversión', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    }
    if (movement._isTransfer) {
      return { type: 'Transferencia', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    }
    
    // Determinar por categoría del movimiento, no solo por monto
    const typeName = movement.movement_data?.type?.name?.toLowerCase() || '';
    const categoryName = movement.movement_data?.category?.name?.toLowerCase() || '';
    
    // Si tiene tipo de datos, usarlo para determinar
    if (typeName.includes('ingreso') || categoryName.includes('ingreso')) {
      return { type: 'Ingreso', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
    
    // Si es egreso o tiene monto negativo, es egreso
    if (typeName.includes('egreso') || categoryName.includes('egreso') || movement.amount < 0) {
      return { type: 'Egreso', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    }
    
    // Por defecto, si el monto es positivo y no está clasificado, considerarlo ingreso
    if (movement.amount > 0) {
      return { type: 'Ingreso', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
    
    return { type: 'Egreso', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  }

  const movementTypeInfo = getMovementTypeInfo()

  const viewPanel = (
    <div className="space-y-6">
      {/* Fecha arriba */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          {formatDate(movement.movement_date)}
        </div>
      </div>
      
      {/* Header con tipo de movimiento y monto principal */}
      <div className="flex items-center justify-between">
        <Badge className={`${movementTypeInfo.color} px-4 py-2 text-base font-medium`}>
          {movementTypeInfo.type}
        </Badge>
        <div className="text-right">
          <div className={`text-2xl font-bold ${movement.amount < 0 || movement.movement_data?.type?.name?.toLowerCase()?.includes('egreso') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatAmount(movement.amount, movement.movement_data?.currency?.symbol)}
          </div>
          <div className="text-sm text-muted-foreground">
            {movement.movement_data?.wallet?.name || 'Sin billetera'}
          </div>
          {movement.exchange_rate && (
            <div className="text-sm text-muted-foreground">
              Tipo de cambio: {movement.exchange_rate}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoría */}
        {movement.movement_data?.category && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4 text-accent" />
              Categoría
            </div>
            <div className="text-sm text-foreground">
              {movement.movement_data.type?.name} / {movement.movement_data.category?.name}
              {movement.movement_data?.subcategory && (
                <span> / {movement.movement_data.subcategory.name}</span>
              )}
            </div>
          </div>
        )}

        {/* Proyecto */}
        {movement.movement_data?.project && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building className="h-4 w-4 text-accent" />
              Proyecto
            </div>
            <div className="text-sm text-foreground">
              {movement.movement_data.project.name}
            </div>
          </div>
        )}
      </div>

      {/* Descripción */}
      {movement.description && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Descripción
            </div>
            <div className="text-sm text-foreground bg-muted/20 p-3 rounded-md">
              {movement.description}
            </div>
          </div>
        </>
      )}

      {/* Detalles adicionales - Conversión */}
      {movement._isConversion && movement._conversionData && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
              Detalles de la Conversión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movement._conversionData.movements?.map((mov: any, index: number) => (
                <div key={mov.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={mov.amount > 0 ? "default" : "destructive"}>
                      {mov.amount > 0 ? 'Entrada' : 'Salida'}
                    </Badge>
                    <span className="font-bold">
                      {formatAmount(mov.amount, mov.currency?.symbol)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mov.wallet?.name} • {mov.currency?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detalles adicionales - Transferencia */}
      {movement._isTransfer && movement._transferData && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Wallet className="h-4 w-4 text-accent" />
              Detalles de la Transferencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movement._transferData.movements?.map((mov: any, index: number) => (
                <div key={mov.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={mov.amount > 0 ? "default" : "destructive"}>
                      {mov.amount > 0 ? 'Destino' : 'Origen'}
                    </Badge>
                    <span className="font-bold">
                      {formatAmount(mov.amount, mov.currency?.symbol)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mov.wallet?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detalles adicionales - Cliente y Cuota (si existen) */}
      {(movement.movement_data?.client_name || movement.movement_data?.installment_number) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-accent" />
              Aportes de Clientes
            </h3>
            
            {movement.movement_data?.client_name && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4 text-accent" />
                  Cliente
                </div>
                <div className="text-sm text-foreground">
                  {movement.movement_data.client_name}
                </div>
              </div>
            )}
            
            {movement.movement_data?.unit && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building className="h-4 w-4 text-accent" />
                  Unidad Funcional
                </div>
                <div className="text-sm text-foreground">
                  {movement.movement_data.unit}
                </div>
              </div>
            )}
            
            {movement.movement_data?.installment_number && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash className="h-4 w-4 text-accent" />
                  Cuota
                </div>
                <div className="text-sm text-foreground">
                  #{movement.movement_data.installment_number}
                </div>
              </div>
            )}
          </div>
        </>
      )}


    </div>
  )

  const headerContent = (
    <FormModalHeader 
      title="Ver Movimiento"
      icon={Eye}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
      rightLabel="Editar"
      onRightClick={handleEdit}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={null}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      wide={true}
    />
  )
}