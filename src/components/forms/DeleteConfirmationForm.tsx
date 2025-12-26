import { useState } from 'react'
import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ComboBox } from "@/components/shared/fields/ComboBoxWriteField"
interface ReplacementOption {
  label: string
  value: string
}
interface DeleteConfirmationFormProps {
  modalData?: {
    mode?: 'delete'| 'replace'| 'dangerous'
    title: string
    description: string
    itemName: string
    itemDetails?: string
    itemType?: string
    consequences?: string[]
    replacementOptions?: ReplacementOption[]
    currentId?: string
    destructiveActionText?: string
    onDelete?: () => void
    onReplace?: (newId: string) => void
    onConfirm?: () => void
    isLoading?: boolean
  }
  onClose: () => void
}
function DeleteContent({
  mode,
  description,
  itemName,
  consequences,
  actionType,
  setActionType,
  selectedReplacementId,
  setSelectedReplacementId,
  replacementOptions,
  currentId,
}: {
  mode: 'delete'| 'replace'
  description: string
  itemName: string
  consequences?: string[]
  actionType: 'delete'| 'replace'
  setActionType: (value: 'delete'| 'replace') => void
  selectedReplacementId: string
  setSelectedReplacementId: (value: string) => void
  replacementOptions: ReplacementOption[]
  currentId?: string
}) {
  const filteredReplacementOptions = replacementOptions.filter(
    option => option.value !== currentId
  )
  return (
    <div className="space-y-6">
      {/* Advertencia */}
      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Esta acción no se puede deshacer
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {/* Consecuencias */}
      {consequences && consequences.length > 0 && (
        <div className="rounded-lg border border-warning/25 bg-warning/5 p-4">
          <p className="text-sm font-semibold text-warning mb-2">¿Qué pasará?</p>
          <ul className="space-y-1.5">
            {consequences.map((consequence, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-warning flex-shrink-0">•</span>
                <span>{consequence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Modo REPLACE - Seleccionar acción */}
      {mode === 'replace'&& (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué acción querés realizar?</Label>
            <Select value={actionType} onValueChange={(value: 'delete'| 'replace') => setActionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">Eliminar definitivamente</SelectItem>
                <SelectItem value="replace">Reemplazar por otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {actionType === 'replace'&& (
            <div className="space-y-2">
              <Label>Selecciona el reemplazo</Label>
              <ComboBox
                value={selectedReplacementId}
                onValueChange={setSelectedReplacementId}
                options={filteredReplacementOptions}
                placeholder="Seleccionar opción"
                searchPlaceholder="Buscar..."
                emptyMessage="No hay opciones disponibles"
              />
            </div>
          )}
          {/* Advertencia contextual - Solo para reemplazar */}
          {actionType === 'replace'&& (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  Esta acción reemplazará todas las referencias
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default function DeleteConfirmationForm({
  modalData,
}: DeleteConfirmationFormProps) {
  const { popModal } = useGlobalModalStore()
  
  // Extraer datos del modal
  const mode = modalData?.mode || 'delete'
  const title = modalData?.title || 'Confirmar eliminación'
  const description = modalData?.description || '¿Estás seguro?'
  const itemName = modalData?.itemName || 'elemento'
  const itemDetails = modalData?.itemDetails
  const itemType = modalData?.itemType || 'elemento'
  const consequences = modalData?.consequences || []
  const replacementOptions = modalData?.replacementOptions || []
  const currentId = modalData?.currentId
  const destructiveActionText = modalData?.destructiveActionText || 'Eliminar'
  
  // Callbacks de negocio (vienen del feature)
  const onDelete = modalData?.onDelete
  const onReplace = modalData?.onReplace
  const onConfirm = modalData?.onConfirm
  const externalIsLoading = modalData?.isLoading || false
  
  // State local del formulario
  const [actionType, setActionType] = useState<'delete'| 'replace'>('delete')
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationText, setConfirmationText] = useState<string>('')
  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (mode === 'dangerous') {
        await onConfirm?.()
      } else if (mode === 'replace') {
        if (actionType === 'delete') {
          await onDelete?.()
        } else if (actionType === 'replace'&& selectedReplacementId) {
          await onReplace?.(selectedReplacementId)
        }
      } else {
        // mode === 'delete'
        await onDelete?.()
      }
      popModal()
    } finally {
      setIsLoading(false)
    }
  }
  const isSubmitDisabled = () => {
    const finalIsLoading = isLoading || externalIsLoading
    if (finalIsLoading) return true
    if (mode === 'dangerous'&& confirmationText !== itemName) {
      return true
    }
    if (mode === 'replace'&& actionType === 'replace'&& !selectedReplacementId) {
      return true
    }
    return false
  }
  const getSubmitButtonText = () => {
    const finalIsLoading = isLoading || externalIsLoading
    if (finalIsLoading) {
      if (mode === 'dangerous') return `${destructiveActionText}...`
      return actionType === 'replace'? 'Reemplazando...': 'Eliminando...'
    }
    if (mode === 'dangerous') return destructiveActionText
    return actionType === 'replace'? 'Reemplazar': 'Eliminar'
  }
  // Modo DANGEROUS - Requiere escribir el nombre exacto
  if (mode === 'dangerous') {
    return (
      <ModalLayout onClose={popModal} size="md">
        <ModalHeader 
          title={title}
          icon={Trash2}
        />
        
        <ModalBody>
          <div className="space-y-6">
            {/* Advertencia principal */}
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  Esta acción no se puede deshacer
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {/* Detalles del item */}
            {itemDetails && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Vas a eliminar:</p>
                <p className="text-sm font-semibold">{itemName}</p>
                <p className="text-xs text-muted-foreground mt-1">{itemDetails}</p>
              </div>
            )}
            {/* Consecuencias */}
            {consequences && consequences.length > 0 && (
              <div className="rounded-lg border border-warning/25 bg-warning/5 p-4">
                <p className="text-sm font-semibold text-warning mb-2">¿Qué pasará?</p>
                <ul className="space-y-1.5">
                  {consequences.map((consequence, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-warning flex-shrink-0">•</span>
                      <span>{consequence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Input de confirmación */}
            <div className="space-y-4">
              <Label htmlFor="confirmation-input">
                Escribe el nombre del {itemType} para confirmar:
              </Label>
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                <p className="text-lg font-mono font-semibold text-destructive">{itemName}</p>
              </div>
              <Input
                id="confirmation-input"
                placeholder={`Escribe "${itemName}"`}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isLoading || externalIsLoading}
                data-testid="input-confirmation"
              />
              {confirmationText && confirmationText !== itemName && (
                <p className="text-xs text-muted-foreground">
                  Debe coincidir exactamente
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={popModal}
          submitText={getSubmitButtonText()}
          onSubmit={handleSubmit}
          submitVariant="destructive"
          isSubmitting={isLoading || externalIsLoading}
          submitDisabled={isSubmitDisabled()}
        />
      </ModalLayout>
    )
  }
  return (
    <ModalLayout onClose={popModal} size="md">
      <ModalHeader 
        title={title}
        icon={Trash2}
      />
      
      <ModalBody>
        <DeleteContent
          mode={mode as 'delete'| 'replace'}
          description={description}
          itemName={itemName}
          consequences={consequences}
          actionType={actionType}
          setActionType={setActionType}
          selectedReplacementId={selectedReplacementId}
          setSelectedReplacementId={setSelectedReplacementId}
          replacementOptions={replacementOptions}
          currentId={currentId}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={popModal}
        submitText={getSubmitButtonText()}
        onSubmit={handleSubmit}
        submitVariant="destructive"
        isSubmitting={isLoading || externalIsLoading}
        submitDisabled={isSubmitDisabled()}
      />
    </ModalLayout>
  )
}
