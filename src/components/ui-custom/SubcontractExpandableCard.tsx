import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Package, Calendar, FileText, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteSubcontract } from '@/hooks/use-subcontracts'
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
}

export function SubcontractExpandableCard({ subcontract }: SubcontractExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const deleteSubcontract = useDeleteSubcontract()

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'secondary'
      case 'en_progreso':
        return 'default'
      case 'completado':
        return 'default'
      case 'cancelado':
        return 'destructive'
      default:
        return 'secondary'
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
  const handleEdit = () => {
    openModal('subcontract', {
      projectId: subcontract.project_id,
      organizationId: subcontract.organization_id,
      subcontractId: subcontract.id,
      isEditing: true
    })
  }

  // Función para eliminar el subcontrato
  const handleDelete = async () => {
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">{subcontract.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(subcontract.status)}>
              {getStatusText(subcontract.status)}
            </Badge>
            
            <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-11">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(subcontract.date)}</span>
          </div>
          {subcontract.notes && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Con notas</span>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4 ml-11">
            {subcontract.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground">Notas</h4>
                <p className="text-sm text-foreground">{subcontract.notes}</p>
              </div>
            )}

            {/* Aquí se mostrarán las tareas asociadas en el futuro */}
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground">Tareas del Subcontrato</h4>
              <p className="text-sm text-muted-foreground italic">
                Las tareas asociadas a este subcontrato aparecerán aquí próximamente.
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Creado</span>
                  <p className="text-foreground">
                    {subcontract.created_at ? formatDate(subcontract.created_at) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Actualizado</span>
                  <p className="text-foreground">
                    {subcontract.updated_at ? formatDate(subcontract.updated_at) : 'N/A'}
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