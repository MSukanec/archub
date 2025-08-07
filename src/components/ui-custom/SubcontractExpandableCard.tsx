import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, FileText, Edit, Trash2, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteSubcontract } from '@/hooks/use-subcontracts'
import { useSubcontractBids } from '@/hooks/use-subcontract-bids'
import { useCurrentUser } from '@/hooks/use-current-user'
import { toast } from '@/hooks/use-toast'

interface SubcontractExpandableCardProps {
  subcontract: {
    id: string
    title: string
    date: string
    status: string
    notes?: string | null
    project_id: string
    organization_id: string
    contact_id?: string | null
    currency_id?: string | null
    amount_total?: number | null
    exchange_rate?: number | null
    created_at?: string
    updated_at?: string
  }
  isExpanded: boolean
  onToggle: () => void
}

export function SubcontractExpandableCard({ subcontract, isExpanded, onToggle }: SubcontractExpandableCardProps) {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const { data: bids = [], isLoading: bidsLoading } = useSubcontractBids(subcontract.id)
  const deleteSubcontract = useDeleteSubcontract()

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'outline'
      case 'en_progreso':
        return 'default'
      case 'completado':
        return 'secondary'
      case 'cancelado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Función para obtener el texto del estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente'
      case 'en_progreso':
        return 'En Progreso'
      case 'completado':
        return 'Completado'
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

  // Función para editar el subcontrato
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal('subcontract', {
      projectId: subcontract.project_id,
      organizationId: subcontract.organization_id,
      subcontractId: subcontract.id,
      isEditing: true
    })
  }

  // Función para nueva oferta
  const handleNewOffer = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal('subcontract-bid', {
      subcontractId: subcontract.id,
      projectId: subcontract.project_id,
      organizationId: subcontract.organization_id
    })
  }

  // Función para eliminar el subcontrato
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de que quieres eliminar este subcontrato?')) {
      try {
        await deleteSubcontract.mutateAsync(subcontract.id)
        toast({
          title: "Subcontrato eliminado",
          description: "El subcontrato se eliminó correctamente"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el subcontrato",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Card className="w-full cursor-pointer hover:bg-accent/50 transition-colors" onClick={onToggle}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <h3 className="font-medium text-sm">{subcontract.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(subcontract.status)}>
              {getStatusText(subcontract.status)}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={handleNewOffer}
                className="h-8 text-xs px-3"
              >
                Nueva Oferta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4 ml-5">
            {subcontract.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground">Notas</h4>
                <p className="text-sm text-foreground">{subcontract.notes}</p>
              </div>
            )}

            {/* Ofertas del subcontrato */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground">Ofertas Recibidas</h4>
                {bids.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {bids.length} oferta{bids.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {bidsLoading ? (
                <p className="text-sm text-muted-foreground italic">Cargando ofertas...</p>
              ) : bids.length > 0 ? (
                <div className="space-y-2">
                  {bids.slice(0, 3).map((bid: any) => (
                    <div key={bid.id} className="bg-accent/30 rounded-md p-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{bid.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-primary">
                              ${bid.amount?.toLocaleString() || '0'}
                            </span>
                            {bid.currencies && (
                              <span className="text-xs text-muted-foreground">
                                {bid.currencies.code}
                              </span>
                            )}
                          </div>
                          {bid.contacts && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Por: {bid.contacts.name}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={bid.status === 'aceptada' ? 'default' : bid.status === 'rechazada' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {bid.status === 'pendiente' ? 'Pendiente' : 
                           bid.status === 'aceptada' ? 'Aceptada' : 'Rechazada'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bids.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Y {bids.length - 3} oferta{bids.length - 3 !== 1 ? 's' : ''} más...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aún no hay ofertas para este subcontrato.
                </p>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Fecha</span>
                  <p className="text-foreground">
                    {formatDate(subcontract.date)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Creado</span>
                  <p className="text-foreground">
                    {subcontract.created_at ? formatDate(subcontract.created_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}