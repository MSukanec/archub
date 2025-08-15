import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSubcontracts } from '@/hooks/use-subcontracts'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'wouter'

export function SubcontractList() {
  const { data: userData } = useCurrentUser()
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null)
  const { openModal } = useGlobalModalStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!subcontracts || subcontracts.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12 text-muted-foreground" />}
        title="No hay subcontratos"
        description="Aún no has creado ningún subcontrato. Haz clic en 'Nuevo Subcontrato' para comenzar."
        action={
          <Button 
            onClick={() => openModal('subcontract', {
              projectId: userData?.preferences?.last_project_id,
              organizationId: userData?.organization?.id,
              userId: userData?.user?.id,
              isEditing: false
            })}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Subcontrato
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {subcontracts.length} subcontrato{subcontracts.length !== 1 ? 's' : ''}
        </div>
        <Button 
          onClick={() => openModal('subcontract', {
            projectId: userData?.preferences?.last_project_id,
            organizationId: userData?.organization?.id,
            userId: userData?.user?.id,
            isEditing: false
          })}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Subcontrato
        </Button>
      </div>
      
      <div className="grid gap-4">
        {subcontracts.map((subcontract) => (
          <Card key={subcontract.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Link 
                    href={`/construction/subcontracts/${subcontract.id}`}
                    className="font-semibold text-base hover:text-primary transition-colors truncate"
                  >
                    {subcontract.name}
                  </Link>
                  <Badge 
                    variant={subcontract.status === 'awarded' ? 'default' : subcontract.status === 'active' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {subcontract.status === 'awarded' ? 'Adjudicado' : 
                     subcontract.status === 'active' ? 'Activo' : 
                     subcontract.status === 'draft' ? 'Borrador' : 
                     subcontract.status === 'completed' ? 'Completado' : 
                     'Cancelado'}
                  </Badge>
                </div>
                
                {subcontract.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {subcontract.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Subcontratista: {subcontract.contact?.name || 'Sin asignar'}
                  </span>
                  {subcontract.start_date && (
                    <span>
                      Inicio: {new Date(subcontract.start_date).toLocaleDateString('es-AR')}
                    </span>
                  )}
                  {subcontract.end_date && (
                    <span>
                      Fin: {new Date(subcontract.end_date).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = `/construction/subcontracts/${subcontract.id}`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModal('subcontract', {
                    projectId: userData?.preferences?.last_project_id,
                    organizationId: userData?.organization?.id,
                    userId: userData?.user?.id,
                    isEditing: true,
                    subcontract
                  })}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}