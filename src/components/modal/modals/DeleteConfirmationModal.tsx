import { useState, useEffect, useRef } from 'react'
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
import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField"
import { Button } from "@/components/ui/button"

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
    
    // En modo dangerous, requiere escribir el nombre exacto
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
    <div className="space-y-6">
      {/* 1. Sección: Lo que hace la acción */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
          <Trash2 className="h-6 w-6 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Dangerous mode - Write to confirm */}
      {mode === 'dangerous' && itemName && (
        <div className="space-y-4">
          {/* 2. Advertencia de que no se puede deshacer */}
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Esta acción no se puede deshacer
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Para confirmar la eliminación, escribí el nombre del {itemType} exactamente como aparece abajo.
            </p>
          </div>

          {/* 3. Referencia: Qué vas a borrar */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Para eliminar, escribí:
            </p>
            <p className="text-sm font-semibold text-foreground font-mono">
              {itemName}
            </p>
          </div>

          {/* 4. Input para escribir */}
          <div className="space-y-2">
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

      {/* Replace mode controls */}
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
        </div>
      )}

      {/* Warning message for simple mode */}
      {mode === 'simple' && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      )}

      {/* Warning message for replace mode */}
      {mode === 'replace' && (
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