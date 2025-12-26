import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical, Eye, Edit } from 'lucide-react'
import { useHeroSections, useDeleteHeroSection, useReorderHeroSections } from '@/features/layout/hooks/use-hero-sections'
import { useGlobalModalStore } from '@/components/modal'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
const AdminLayoutContentView = () => {
  const { data: heroSections = [], isLoading } = useHeroSections('learning_dashboard')
  const deleteHeroMutation = useDeleteHeroSection()
  const reorderMutation = useReorderHeroSections()
  const { openModal } = useGlobalModalStore()
  const { toast } = useToast()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const handleCreateSection = () => {
    openModal('hero-section-form', { mode: 'create'})
  }
  const handleEditSection = (section: any) => {
    openModal('hero-section-form', { mode: 'edit', section })
  }
  const handleDeleteSection = (section: any) => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Sección del Hero',
      description: `¿Estás seguro de que querés eliminar esta sección? "${section.title}"`,
      destructiveActionText: 'Eliminar',
      onDelete: () => deleteHeroMutation.mutate(section.id)
    })
  }
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedId(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return
    const draggedIndex = heroSections.findIndex((s: any) => s.id === draggedId)
    const targetIndex = heroSections.findIndex((s: any) => s.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) return
    const newSections = [...heroSections]
    ;[newSections[draggedIndex], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[draggedIndex]
    ]
    const reorderData = newSections.map((s: any, i) => ({
      id: s.id,
      order_index: i
    }))
    reorderMutation.mutate(reorderData, {
      onSuccess: () => {
        toast({
          title: 'Secciones reordenadas',
          description: 'El orden del carrusel se actualizó correctamente'
        })
      }
    })
    setDraggedId(null)
  }
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  return (
    <div className="space-y-6" data-testid="admin-layout-content-view">
      {heroSections.length > 0 ? (
        <div className="space-y-3">
          {(heroSections as any[]).map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
              data-testid={`hero-section-${section.id}`}
            >
              <div className="flex items-start gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{section.title}</h3>
                    <Badge variant="neutral" className="text-xs">
                      {index + 1}
                    </Badge>
                    {section.is_active && (
                      <Badge className="text-xs" style={{ backgroundColor: 'var(--accent)'}}>
                        Activo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {section.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {section.media_url && (
                      <Badge
                        variant="info"
                        className="text-xs"
                        data-testid="badge-media-type"
                      >
                        {section.media_type === 'video'? '📹 Video': '🖼️ Imagen'}
                      </Badge>
                    )}
                    {section.primary_button_text && (
                      <Badge variant="neutral" className="text-xs">
                        {section.primary_button_text}
                      </Badge>
                    )}
                    {section.secondary_button_text && (
                      <Badge variant="neutral" className="text-xs">
                        {section.secondary_button_text}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditSection(section)}
                    data-testid="button-edit-hero"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSection(section)}
                    data-testid="button-delete-hero"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Eye className="w-12 h-12" />}
          title="Sin secciones en el carrusel"
          description="Crea tu primera sección del hero para el dashboard de capacitaciones"
          action={
            <Button onClick={handleCreateSection} data-testid="button-create-first-hero">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Sección
            </Button>
          }
        />
      )}
    </div>
  )
}
export default AdminLayoutContentView
