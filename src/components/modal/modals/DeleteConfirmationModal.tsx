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
import { ComboBox } from "@/components/ui-custom/ComboBoxWriteField"
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
  
  // Estados para el botón de mantener presionado (modo dangerous)
  const [isPressed, setIsPressed] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pressStartTime = useRef<number>(0)

  // Always set to edit panel since this is a form modal
  const { setPanel } = useModalPanelStore()
  
  useEffect(() => {
    setPanel('edit')  // Always edit for form modals as per README.md
  }, [setPanel])

  // Manejar el timer del botón presionado
  useEffect(() => {
    if (isPressed && mode === 'dangerous') {
      pressStartTime.current = Date.now()
      
      const updateProgress = () => {
        const elapsed = Date.now() - pressStartTime.current
        const newProgress = Math.min(elapsed / 4000, 1) // 4 segundos = 100%
        
        setProgress(newProgress)
        
        if (newProgress >= 1) {
          // Completado - ejecutar acción
          handlePressComplete()
          return
        }
        
        timerRef.current = setTimeout(updateProgress, 16) // ~60fps
      }
      
      updateProgress()
    } else {
      // Resetear progreso si se suelta antes de completar
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setProgress(0)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPressed, mode])

  const handlePressComplete = () => {
    setIsPressed(false)
    setProgress(0)
    
    const confirmFunction = onConfirm || onDelete
    if (confirmFunction) {
      confirmFunction()
      closeModal()
    }
  }

  const handleMouseDown = () => {
    if (mode === 'dangerous' && !isLoading) {
      setIsPressed(true)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const handleMouseLeave = () => {
    setIsPressed(false)
  }

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
    
    // En modo dangerous ahora nunca está deshabilitado - se controla por presionado
    if (mode === 'dangerous') {
      return false
    }
    
    /* COMENTADO: Lógica anterior que requería escribir texto
    if (mode === 'dangerous') {
      return inputValue.trim() !== (itemName || '').trim()
    }
    */
    
    if (mode === 'replace' && actionType === 'replace') {
      return !selectedReplacementId
    }
    
    return false
  }

  const viewPanel = null; // Not needed for delete confirmation

  const editPanel = (
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

      {/* Dangerous mode - Hold to delete */}
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
              Para confirmar, mantené presionado el botón "Eliminar" por 4 segundos
            </p>
          </div>
        </div>
      )}

      {/* Dangerous mode input - COMENTADO: Ya no se usa la funcionalidad de escribir texto
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
      */}

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

  // Botón personalizado para modo dangerous con progreso visual
  const customDangerousButton = mode === 'dangerous' ? (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto relative z-0">
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          className="w-1/4"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={isLoading}
          className={`w-3/4 relative overflow-hidden transition-all duration-75 text-white ${
            isLoading 
              ? 'bg-destructive/70 cursor-not-allowed' 
              : isPressed
                ? 'bg-destructive' 
                : 'bg-destructive hover:bg-destructive/90'
          }`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            background: isPressed 
              ? `linear-gradient(to right, 
                  hsl(var(--destructive)) 0%, 
                  hsl(var(--destructive)) ${progress * 100}%, 
                  hsl(var(--destructive)/0.7) ${progress * 100}%, 
                  hsl(var(--destructive)/0.7) 100%)`
              : undefined
          }}
        >
          <span className="relative z-10">
            {isLoading 
              ? 'Eliminando...' 
              : isPressed 
                ? `Mantené presionado... ${Math.round(progress * 100)}%`
                : 'Mantener Presionado para Eliminar'
            }
          </span>
          {/* Barra de progreso visual adicional */}
          {isPressed && (
            <div 
              className="absolute inset-0 bg-red-600/30 transition-all duration-75 ease-linear"
              style={{
                transform: `scaleX(${progress})`,
                transformOrigin: 'left center'
              }}
            />
          )}
        </Button>
      </div>
    </div>
  ) : null;

  const footerContent = mode === 'dangerous' ? customDangerousButton : (
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