import { Receipt } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { useGeneralCost } from '../hooks/use-general-cost'

interface GeneralCostViewProps {
  modalData?: {
    generalCostId?: string
  }
  onClose: () => void
}

export default function GeneralCostView({ modalData, onClose }: GeneralCostViewProps) {
  const { data: generalCost, isLoading } = useGeneralCost(modalData?.generalCostId || null)

  if (isLoading) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title="Detalle de Gasto General"
        description="Información del concepto de gasto"
        icon={Receipt}
      />

      <ModalBody>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nombre</p>
            <p className="font-medium" data-testid="text-general-cost-name">
              {generalCost?.name}
            </p>
          </div>
          {generalCost?.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-general-cost-description">
                {generalCost.description}
              </p>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
    </ModalLayout>
  )
}
