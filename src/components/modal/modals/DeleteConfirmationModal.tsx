import { useState, useEffect } from 'react'
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore"
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore"
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"

import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import FormModalBody from "@/components/modal/form/FormModalBody"
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite"

interface ReplacementOption {
  label: string
  value: string
}

interface DeleteConfirmationModalProps {
  mode?: 'simple' | 'dangerous' | 'replace'
  title: string
  description: string
  itemName?: string
  itemType?: string // Tipo de elemento (ej: "concepto", "material", "categoría", etc.)
  destructiveActionText?: string
  onConfirm?: () => void
  onDelete?: () => void
  onReplace?: (newId: string) => void
  replacementOptions?: ReplacementOption[]
  currentCategoryId?: string
  isLoading?: boolean
}

export default function DeleteConfirmationModal({
  mode = 'simple',
  title,
  description,
  itemName,
  itemType = "elemento",
  destructiveActionText = "Eliminar",
  onConfirm,
  onDelete,
  onReplace,
  replacementOptions = [],
  currentCategoryId,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const { closeModal } = useGlobalModalStore()
  const [actionType, setActionType] = useState<'delete' | 'replace'>('delete')
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')

  // Always set to edit panel since this is a form modal
  const { setPanel } = useModalPanelStore()
  
  useEffect(() => {
    setPanel('edit')  // Always edit for form modals as per README.md
  }, [setPanel])

  const handleSubmit = () => {
    if (mode === 'simple') {
      const confirmFunction = onConfirm || onDelete
      if (confirmFunction) {
        confirmFunction()
        closeModal()
      }
    } else if (mode === 'dangerous') {
      if (inputValue.trim() === (itemName || '').trim()) {
        const confirmFunction = onConfirm || onDelete
        if (confirmFunction) {
          confirmFunction()
          closeModal()
        }
      }
    } else if (mode === 'replace') {
      if (actionType === 'delete' && onDelete) {
        onDelete()
        closeModal()
      } else if (actionType === 'replace' && onReplace && selectedReplacementId) {
        onReplace(selectedReplacementId)
        closeModal()
      }
    }
  }

  const handleCancel = () => {
    closeModal()
  }

  // Filtrar opciones para no mostrar la categoría actual
  const filteredReplacementOptions = replacementOptions.filter(
    option => option.value !== currentCategoryId
  )

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

  const viewPanel = null; // Not needed for delete confirmation

  const editPanel = (
      {/* Warning section */}
        </div>
            {description}
          </p>
          {itemName && (
            </p>
          )}
        </div>
      </div>

      {/* Dangerous mode input */}
      {mode === 'dangerous' && itemName && (
                Esta acción no se puede deshacer
              </p>
            </div>
            </p>
          </div>
          <Input
            placeholder={`Escribí "${itemName}" para confirmar`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Replace mode controls */}
      {mode === 'replace' && (
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
        </div>
      )}

      {/* Warning message for simple mode */}
      {mode === 'simple' && (
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      )}

      {/* Warning message for replace mode */}
      {mode === 'replace' && (
              {actionType === 'replace' 
                ? `Esta acción reemplazará todos los usos del ${itemType} actual`
                : 'Esta acción no se puede deshacer'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={title}
      icon={Trash2}
    />
  );

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleCancel}
      submitText={getSubmitButtonText()}
      onSubmit={handleSubmit}
      submitVariant="destructive"
      submitDisabled={isSubmitDisabled()}
      showLoadingSpinner={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  );
}