import { useState } from 'react'
import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField"

interface ReplacementOption {
  label: string
  value: string
}

interface DeleteConfirmationFormProps {
  modalData?: {
    mode?: 'simple' | 'dangerous' | 'replace'
    title?: string
    description?: string
    itemName?: string
    itemType?: string
    itemDetails?: string
    destructiveActionText?: string
    consequences?: string[]  // Ej: ['5 pagos perderán su referencia', 'Los reportes se verán afectados']
    replacementOptions?: ReplacementOption[]
    currentCategoryId?: string
  }
  onClose: () => void
  onConfirm?: () => void
  onDelete?: () => void
  onReplace?: (newId: string) => void
  isLoading?: boolean
}

// Subcomponente: Contenido del modal de eliminación
function DeleteContent({
  mode,
  description,
  itemName,
  itemType,
  itemDetails,
  consequences,
  actionType,
  setActionType,
  selectedReplacementId,
  setSelectedReplacementId,
  inputValue,
  setInputValue,
  replacementOptions,
  currentCategoryId,
}: {
  mode: 'simple' | 'dangerous' | 'replace'
  description: string
  itemName?: string
  itemType?: string
  itemDetails?: string
  consequences?: string[]
  actionType: 'delete' | 'replace'
  setActionType: (value: 'delete' | 'replace') => void
  selectedReplacementId: string
  setSelectedReplacementId: (value: string) => void
  inputValue: string
  setInputValue: (value: string) => void
  replacementOptions: ReplacementOption[]
  currentCategoryId?: string
}) {
  const filteredReplacementOptions = replacementOptions.filter(
    option => option.value !== currentCategoryId
  )

  return (
    <div className="space-y-6">
      {/* Advertencia inicial */}
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

      {/* Modo DANGEROUS - Escribir para confirmar */}
      {mode === 'dangerous' && itemName && (
        <div className="space-y-4">
          {/* Tarjeta con datos del elemento */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                <Trash2 className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {itemName}
                </p>
                {itemDetails && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {itemDetails}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Input para confirmar */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Para eliminar, escribí <span className="font-semibold text-foreground font-mono">{itemName}</span> abajo
            </p>
            <Input
              placeholder={`Escribí "${itemName}" para confirmar`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono"
              autoFocus
              data-testid="delete-confirmation-input"
            />
          </div>
        </div>
      )}

      {/* Modo REPLACE - Opciones de acción */}
      {mode === 'replace' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="action-type">¿Qué acción querés realizar?</Label>
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
              <Label htmlFor="replacement-category">¿Por cuál {itemType} querés reemplazarlo?</Label>
              <ComboBox
                value={selectedReplacementId}
                onValueChange={setSelectedReplacementId}
                options={filteredReplacementOptions}
                placeholder={`Seleccionar ${itemType} de reemplazo`}
                searchPlaceholder={`Buscar ${itemType}...`}
                emptyMessage={`No se encontraron ${itemType}s.`}
              />
            </div>
          )}

          {/* Advertencia para modo replace */}
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {actionType === 'replace' 
                  ? `Esta acción reemplazará todos los usos del ${itemType} actual`
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
  onClose,
  onConfirm: confirmProp,
  onDelete: deleteProp,
  onReplace: replaceProp,
  isLoading: isLoadingProp = false
}: DeleteConfirmationFormProps) {
  const { popModal } = useGlobalModalStore()
  
  const mode = modalData?.mode || 'simple'
  const title = modalData?.title || 'Confirmar eliminación'
  const description = modalData?.description || '¿Estás seguro que querés continuar?'
  const itemName = modalData?.itemName
  const itemType = modalData?.itemType || 'elemento'
  const itemDetails = modalData?.itemDetails
  const consequences = modalData?.consequences || []
  const destructiveActionText = modalData?.destructiveActionText || 'Eliminar'
  const replacementOptions = modalData?.replacementOptions || []
  const currentCategoryId = modalData?.currentCategoryId
  
  // Leer callbacks de modalData (cuando se pasa a través de openModal)
  const onConfirm = confirmProp || (modalData as any)?.onConfirm
  const onDelete = deleteProp || (modalData as any)?.onDelete
  const onReplace = replaceProp || (modalData as any)?.onReplace
  const isLoading = isLoadingProp || (modalData as any)?.isLoading || false

  const [actionType, setActionType] = useState<'delete' | 'replace'>('delete')
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')

  const handleDelete = () => {
    if (mode === 'simple') {
      const confirmFunction = onConfirm || onDelete
      confirmFunction?.()
      popModal()
    } else if (mode === 'dangerous') {
      if (inputValue.trim() === (itemName || '').trim()) {
        const confirmFunction = onConfirm || onDelete
        confirmFunction?.()
        popModal()
      }
    } else if (mode === 'replace') {
      if (actionType === 'delete' && onDelete) {
        onDelete()
        popModal()
      } else if (actionType === 'replace' && onReplace && selectedReplacementId) {
        onReplace(selectedReplacementId)
        popModal()
      }
    }
  }

  const getSubmitButtonText = () => {
    if (isLoading) {
      if (mode === 'replace') {
        return actionType === 'delete' ? 'Eliminando...' : 'Reemplazando...'
      }
      return 'Eliminando...'
    }
    
    if (mode === 'replace') {
      return actionType === 'delete' ? `Eliminar ${itemType}` : `Reemplazar ${itemType}`
    }
    
    return destructiveActionText
  }

  const isSubmitDisabled = () => {
    if (isLoading) return true
    
    if (mode === 'dangerous') {
      return inputValue.trim() !== (itemName || '').trim()
    }
    
    if (mode === 'replace' && actionType === 'replace') {
      return !selectedReplacementId
    }
    
    return false
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
          itemType={itemType}
          itemDetails={itemDetails}
          consequences={consequences}
          actionType={actionType}
          setActionType={setActionType}
          selectedReplacementId={selectedReplacementId}
          setSelectedReplacementId={setSelectedReplacementId}
          inputValue={inputValue}
          setInputValue={setInputValue}
          replacementOptions={replacementOptions}
          currentCategoryId={currentCategoryId}
        />
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={popModal}
        submitText={getSubmitButtonText()}
        onSubmit={handleDelete}
        submitVariant="destructive"
        isSubmitting={isLoading}
        submitDisabled={isSubmitDisabled()}
      />
    </ModalLayout>
  )
}
