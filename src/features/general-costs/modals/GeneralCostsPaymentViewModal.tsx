import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, DollarSign, Paperclip } from 'lucide-react'

import { FormModalLayout } from '@/components/modal'
import { FormModalHeader } from '@/components/modal'
import { FormModalFooter } from '@/components/modal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useGeneralCostPayment } from '../hooks/use-general-cost-payment'
import { useGeneralCostPaymentMedia } from '../hooks/use-general-cost-payment-media'

interface GeneralCostsPaymentViewModalProps {
  modalData: {
    organizationId: string
    paymentId: string
  }
  onClose: () => void
}

export function GeneralCostsPaymentViewModal({ modalData, onClose }: GeneralCostsPaymentViewModalProps) {
  const { organizationId, paymentId } = modalData

  const { data: existingPayment, isLoading: loadingPayment } = useGeneralCostPayment(
    paymentId,
    organizationId
  )

  const { data: existingFiles = [] } = useGeneralCostPaymentMedia(paymentId)

  const handleClose = () => {
    onClose()
  }

  const viewPanel = (
    <div className="space-y-6">
      {loadingPayment ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4 text-accent" />
              {existingPayment?.payment_date ? format(new Date(existingPayment.payment_date), 'dd/MM/yyyy', { locale: es }) : '-'}
            </div>
            
            {existingPayment?.creator?.users && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={existingPayment.creator.users.avatar_url || undefined} alt={existingPayment.creator.users.full_name || ''} />
                  <AvatarFallback className="text-xs">
                    {existingPayment.creator.users.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  {existingPayment.creator.users.full_name}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Gasto General</div>
              <div className="text-sm">{existingPayment?.general_cost?.name || 'Sin categoría'}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Monto</div>
              <div className="text-sm font-bold">
                {existingPayment?.currency?.symbol || '$'} {existingPayment?.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Moneda</div>
              <div className="text-sm">{existingPayment?.currency?.code || '-'}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Billetera</div>
              <div className="text-sm">{existingPayment?.wallet?.wallets?.name || '-'}</div>
            </div>

            {existingPayment?.exchange_rate && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Cotización</div>
                <div className="text-sm">{existingPayment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Estado</div>
              <div className="text-sm">
                {existingPayment?.status === 'confirmed' ? 'Confirmado' : 
                 existingPayment?.status === 'pending' ? 'Pendiente' : 
                 existingPayment?.status === 'rejected' ? 'Rechazado' : 'Anulado'}
              </div>
            </div>

            {existingPayment?.reference && (
              <div className="space-y-2 col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Referencia</div>
                <div className="text-sm">{existingPayment.reference}</div>
              </div>
            )}
          </div>

          {existingPayment?.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Notas</div>
                <div className="text-sm bg-muted/20 p-3 rounded-md">{existingPayment.notes}</div>
              </div>
            </>
          )}

          {existingFiles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Paperclip className="h-4 w-4 text-accent" />
                  Archivos Adjuntos ({existingFiles.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {existingFiles.map((file: any) => (
                    <div key={file.id} className="aspect-square rounded overflow-hidden border">
                      {file.file_type?.startsWith('image') ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Paperclip className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs ml-2">{file.file_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )

  const headerContent = (
    <FormModalHeader
      icon={DollarSign}
      title={`Pago de ${existingPayment?.general_cost?.name || 'Gasto General'}`}
      description={
        existingPayment
          ? `${existingPayment.currency?.symbol || '$'} ${existingPayment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0.00'} - ${existingPayment.payment_date ? format(new Date(existingPayment.payment_date), 'dd/MM/yyyy') : ''}`
          : 'Cargando...'
      }
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={handleClose}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={false}
    />
  )
}
