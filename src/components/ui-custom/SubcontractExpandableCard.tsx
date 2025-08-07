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
              {isExpanded ? (
              ) : (
              )}
            </div>
            
          </div>

            <Badge variant={getStatusBadgeVariant(subcontract.status)}>
              {getStatusText(subcontract.status)}
            </Badge>
            
              <Button
                variant="default"
                size="sm"
                onClick={handleNewOffer}
              >
                Nueva Oferta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
              >
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              >
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
            {subcontract.notes && (
              </div>
            )}

            {/* Ofertas del subcontrato */}
                {bids.length > 0 && (
                    {bids.length} oferta{bids.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {bidsLoading ? (
              ) : bids.length > 0 ? (
                  {bids.slice(0, 3).map((bid: any) => (
                              ${bid.amount?.toLocaleString() || '0'}
                            </span>
                            {bid.currencies && (
                                {bid.currencies.code}
                              </span>
                            )}
                          </div>
                          {bid.contacts && (
                              Por: {bid.contacts.name}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={bid.status === 'aceptada' ? 'default' : bid.status === 'rechazada' ? 'destructive' : 'outline'}
                        >
                          {bid.status === 'pendiente' ? 'Pendiente' : 
                           bid.status === 'aceptada' ? 'Aceptada' : 'Rechazada'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bids.length > 3 && (
                      Y {bids.length - 3} oferta{bids.length - 3 !== 1 ? 's' : ''} más...
                    </p>
                  )}
                </div>
              ) : (
                  Aún no hay ofertas para este subcontrato.
                </p>
              )}
            </div>

                    {formatDate(subcontract.date)}
                  </p>
                </div>
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