import { DollarSign, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { useGlobalModalStore } from '@/components/modal'
import { FormPanel, ViewPanel, useGeneralCostPaymentForm } from '../forms/GeneralCostPaymentForm'

interface GeneralCostPaymentModalProps {
  modalData?: {
    paymentId?: string
  }
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
}

export default function GeneralCostPaymentModal({ 
  modalData, 
  onClose, 
  mode = 'create' 
}: GeneralCostPaymentModalProps) {
  const { openModal } = useGlobalModalStore()
  const paymentId = modalData?.paymentId

  const {
    form,
    onSubmit,
    editingPayment,
    mediaFiles,
    currencies,
    currenciesLoading,
    wallets,
    walletsLoading,
    generalCosts,
    generalCostsLoading,
    isLoading,
    paymentLoading,
    filesToUpload,
    setFilesToUpload,
    existingFiles,
    handleExistingFileDelete,
    openDatePicker,
    setOpenDatePicker,
    visibility,
    isSubmitting,
  } = useGeneralCostPaymentForm({
    paymentId,
    mode,
    onSuccess: onClose,
  })

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: `Pago - ${editingPayment?.general_cost?.name || 'Gasto General'}`,
          description: 'Detalle del pago de gastos generales',
        }
      case 'edit':
        return {
          title: 'Editar Pago de Gastos Generales',
          description: 'Actualiza los detalles del pago',
        }
      case 'create':
      default:
        return {
          title: 'Nuevo Pago de Gastos Generales',
          description: 'Registra un nuevo pago de gastos generales',
        }
    }
  }

  const header = getHeader()

  if (paymentLoading) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalHeader title="Cargando..." />
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  if (mode === 'view' && !editingPayment) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalHeader title="Pago no encontrado" />
        <ModalBody>
          <p className="text-muted-foreground">No se pudo cargar el pago.</p>
        </ModalBody>
        <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={mode === 'view' ? Eye : mode === 'edit' ? Edit : DollarSign}
      />

      <ModalBody>
        {mode === 'view' && editingPayment ? (
          <ViewPanel payment={editingPayment} mediaFiles={mediaFiles} />
        ) : (
          <FormPanel
            form={form}
            currencies={currencies}
            currenciesLoading={currenciesLoading}
            wallets={wallets}
            walletsLoading={walletsLoading}
            generalCosts={generalCosts}
            generalCostsLoading={generalCostsLoading}
            isLoading={isLoading}
            filesToUpload={filesToUpload}
            setFilesToUpload={setFilesToUpload}
            existingFiles={existingFiles}
            onExistingFileDelete={handleExistingFileDelete}
            openDatePicker={openDatePicker}
            setOpenDatePicker={setOpenDatePicker}
            visibility={visibility}
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={mode === 'edit' ? 'Actualizar Pago' : 'Guardar Pago'}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
          submitText="Editar"
          onSubmit={() => openModal('generalCostPayment', { paymentId: editingPayment?.id, mode: 'edit' })}
        />
      )}
    </ModalLayout>
  )
}
