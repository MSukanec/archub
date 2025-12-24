import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign, CalendarIcon, Wallet, Coins, FileText, Paperclip } from 'lucide-react'
import { parseLocalDate } from '@/lib/date-utils'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useGeneralCostPayment } from '../hooks/use-general-cost-payment'
import { useGeneralCostPaymentMedia } from '../hooks/use-general-cost-payment-media'

interface GeneralCostPaymentViewProps {
  modalData?: any
  organizationId?: string
  paymentId?: string
  onClose: () => void
}

import type { BadgeVariant } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  confirmed: { label: 'Confirmado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'pending' },
  rejected: { label: 'Rechazado', variant: 'error' },
  void: { label: 'Anulado', variant: 'neutral' },
}

export default function GeneralCostPaymentView({ 
  modalData, 
  organizationId: orgIdProp, 
  paymentId: paymentIdProp, 
  onClose 
}: GeneralCostPaymentViewProps) {
  const organizationId = orgIdProp || modalData?.organizationId
  const paymentId = paymentIdProp || modalData?.paymentId

  const { data: payment, isLoading } = useGeneralCostPayment(paymentId, organizationId)
  const { data: mediaFiles = [] } = useGeneralCostPaymentMedia(paymentId)

  if (isLoading) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  const statusConfig = STATUS_MAP[payment?.status || 'confirmed']
  const formattedDate = payment?.payment_date 
    ? format(parseLocalDate(payment.payment_date) || new Date(), 'dd MMMM yyyy', { locale: es }) 
    : 'Sin fecha'

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={`Pago - ${payment?.general_cost?.name || 'Gasto General'}`}
        description={formattedDate}
        icon={DollarSign}
      />
      <ModalBody>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground" data-testid="text-payment-date">
                {formattedDate}
              </span>
            </div>

            {payment?.creator?.users && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={payment.creator.users.avatar_url || undefined} 
                    alt={payment.creator.users.full_name || ''} 
                  />
                  <AvatarFallback className="text-xs">
                    {payment.creator.users.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground" data-testid="text-creator">
                  {payment.creator.users.full_name}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Monto
              </p>
              <p className="font-semibold text-lg" data-testid="text-amount">
                {payment?.currency?.symbol || '$'} {payment?.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" /> Moneda
              </p>
              <p className="font-medium" data-testid="text-currency">
                {payment?.currency?.name || '-'} ({payment?.currency?.code})
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Billetera
              </p>
              <p className="font-medium" data-testid="text-wallet">
                {payment?.wallet?.wallets?.name || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={statusConfig.variant} data-testid="text-status">
                {statusConfig.label}
              </Badge>
            </div>

            {payment?.exchange_rate && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cotización</p>
                <p className="font-medium" data-testid="text-exchange-rate">
                  {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
              </div>
            )}

            {payment?.general_cost && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium" data-testid="text-general-cost">
                  {payment.general_cost.name}
                </p>
              </div>
            )}
          </div>

          {payment?.reference && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Referencia
                </p>
                <p className="text-sm" data-testid="text-reference">
                  {payment.reference}
                </p>
              </div>
            </>
          )}

          {payment?.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                <p className="text-sm bg-muted/20 p-3 rounded-md whitespace-pre-wrap" data-testid="text-notes">
                  {payment.notes}
                </p>
              </div>
            </>
          )}

          {mediaFiles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-accent" />
                  Archivos Adjuntos ({mediaFiles.length})
                </p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
                  {mediaFiles.map((file: any) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded overflow-hidden border hover:ring-2 hover:ring-accent transition-all"
                    >
                      {file.file_type?.startsWith('image') ? (
                        <img 
                          src={file.file_url} 
                          alt={file.file_name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-2">
                          <Paperclip className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-center line-clamp-2">{file.file_name}</span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
    </ModalLayout>
  )
}
