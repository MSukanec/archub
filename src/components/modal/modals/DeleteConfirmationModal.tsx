import { useState, useEffect } from 'react'
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore"
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore"
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"

import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ReplacementOption {
  label: string
  value: string
}

interface DeleteConfirmationModalProps {
  mode?: 'simple' | 'dangerous' | 'replace'
  title: string
  description: string
  itemName?: string
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
      return actionType === 'delete' ? 'Eliminar categoría' : 'Reemplazar categoría'
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

  const viewPanel = null // No needed for delete confirmation modal

  const editPanel = (
    <>
      <div className="space-y-6">
        {/* Warning section */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              {description}
            </p>
            {itemName && (
              <p className="text-sm text-muted-foreground mt-2">
                Elemento: <span className="font-medium text-foreground">{itemName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Dangerous mode input */}
        {mode === 'dangerous' && itemName && (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  Esta acción no se puede deshacer
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Para confirmar, escribí el nombre del elemento: <span className="font-medium text-foreground">{itemName}</span>
              </p>
            </div>
            <Input
              placeholder={`Escribí "${itemName}" para confirmar`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono"
              autoFocus
            />
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
                  <SelectItem value="replace">Reemplazar por otra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType === 'replace' && (
              <div className="space-y-2">
                <Label htmlFor="replacement-category">¿Por cuál categoría querés reemplazarla?</Label>
                <Select value={selectedReplacementId} onValueChange={setSelectedReplacementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría de reemplazo" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredReplacementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  ? 'Esta acción reemplazará todos los usos de la categoría actual'
                  : 'Esta acción no se puede deshacer'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  const headerContent = (
    <FormModalHeader 
      title={title}
      icon={Trash2}
    />
  )

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      submitText={getSubmitButtonText()}
      onLeftClick={handleCancel}
      onSubmit={handleSubmit}
      submitVariant="destructive"
      submitDisabled={isSubmitDisabled()}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  )
}