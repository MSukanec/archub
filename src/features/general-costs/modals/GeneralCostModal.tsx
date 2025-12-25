import { Receipt, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { useGlobalModalStore } from '@/components/modal'
import { FormPanel, ViewPanel, useGeneralCostForm } from '../forms/GeneralCostForm'

interface GeneralCostModalProps {
  modalData?: {
    generalCostId?: string
  }
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
}

export default function GeneralCostModal({ modalData, onClose, mode = 'create' }: GeneralCostModalProps) {
  const { openModal } = useGlobalModalStore()
  const generalCostId = modalData?.generalCostId

  const {
    form,
    onSubmit,
    editingGeneralCost,
    categories,
    isSubmitting,
    generalCostLoading,
  } = useGeneralCostForm({
    generalCostId,
    mode,
    onSuccess: onClose,
  })

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: editingGeneralCost?.name || 'Detalle de Gasto General',
          description: 'Información del concepto de gasto',
        }
      case 'edit':
        return {
          title: 'Editar Gasto General',
          description: 'Modifica los datos del gasto general',
        }
      case 'create':
      default:
        return {
          title: 'Nuevo Gasto General',
          description: 'Agrega un nuevo concepto de gasto para tu organización',
        }
    }
  }

  const header = getHeader()

  if ((mode === 'edit' || mode === 'view') && generalCostLoading) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Cargando..." />
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  if (mode === 'view' && !editingGeneralCost) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Gasto no encontrado" />
        <ModalBody>
          <p className="text-muted-foreground">No se pudo cargar el gasto general.</p>
        </ModalBody>
        <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={mode === 'view' ? Eye : mode === 'edit' ? Edit : Receipt}
      />

      <ModalBody>
        {mode === 'view' && editingGeneralCost ? (
          <ViewPanel generalCost={editingGeneralCost} />
        ) : (
          <FormPanel form={form} categories={categories} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={mode === 'create' ? 'Crear' : 'Actualizar'}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
          submitText="Editar"
          onSubmit={() => openModal('generalCost', { generalCostId: editingGeneralCost?.id, mode: 'edit' })}
        />
      )}
    </ModalLayout>
  )
}
