import { useState } from 'react'
import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField"

interface ReplacementOption {
  label: string
  value: string
}

interface DeleteConfirmationFormProps {
  modalData?: {
    mode?: 'delete' | 'replace'
    title: string
    description: string
    itemName: string
    consequences?: string[]
    replacementOptions?: ReplacementOption[]
    currentId?: string
    onDelete: () => void
    onReplace?: (newId: string) => void
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
  mode: 'delete' | 'replace'
  description: string
  itemName: string
  consequences?: string[]
  actionType: 'delete' | 'replace'
  setActionType: (value: 'delete' | 'replace') => void
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
      {mode === 'replace' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué acción querés realizar?</Label>
            <Select value={actionType} onValueChange={(value: 'delete' | 'replace') => setActionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">Eliminar definitivamente</SelectItem>
                <SelectItem value="replace">Reemplazar por otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionType === 'replace' && (
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

          {/* Advertencia dinámica para replace */}
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {actionType === 'replace' 
                  ? 'Esta acción reemplazará todas las referencias'
                  : 'Esta acción no se puede deshacer'
                }
              </p>
            </div>
          </div>
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
  const consequences = modalData?.consequences || []
  const replacementOptions = modalData?.replacementOptions || []
  const currentId = modalData?.currentId
  
  // Callbacks de negocio (vienen del feature)
  const onDelete = modalData?.onDelete
  const onReplace = modalData?.onReplace
  
  // State local del formulario
  const [actionType, setActionType] = useState<'delete' | 'replace'>('delete')
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (mode === 'replace') {
        if (actionType === 'delete') {
          await onDelete?.()
        } else if (actionType === 'replace' && selectedReplacementId) {
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
    if (isLoading) return true
    if (mode === 'replace' && actionType === 'replace' && !selectedReplacementId) {
      return true
    }
    return false
  }

  const getSubmitButtonText = () => {
    if (isLoading) {
      return actionType === 'replace' ? 'Reemplazando...' : 'Eliminando...'
    }
    return actionType === 'replace' ? 'Reemplazar' : 'Eliminar'
  }

  return (
    <ModalLayout onClose={popModal} size="md">
      <ModalHeader 
        title={title}
        icon={Trash2}
      />
      
      <ModalBody>
        <DeleteContent
          mode={mode}
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
        isSubmitting={isLoading}
        submitDisabled={isSubmitDisabled()}
      />
    </ModalLayout>
  )
}
