import { useRef, useState } from 'react'
import { Layout, Image, Palette } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BoardFormFields } from '../forms/BoardFormFields'
import { PinFormFields } from '../forms/PinFormFields'

type ItemType = 'board' | 'pin'

interface ItemTypeConfig {
  id: ItemType
  label: string
  description: string
  icon: typeof Layout
  color: string
  submitLabel: string
}

const ITEM_TYPES: ItemTypeConfig[] = [
  {
    id: 'board',
    label: 'Tablero',
    description: 'Crear un nuevo tablero para organizar pins',
    icon: Layout,
    color: 'text-blue-500',
    submitLabel: 'Crear Tablero',
  },
  {
    id: 'pin',
    label: 'Pin',
    description: 'Subir una imagen de inspiración',
    icon: Image,
    color: 'text-pink-500',
    submitLabel: 'Crear Pin',
  },
]

interface NewMoodboardItemModalProps {
  modalData?: {
    projectId?: string
    organizationId?: string
  }
  onClose: () => void
}

export function NewMoodboardItemModal({ modalData, onClose }: NewMoodboardItemModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState<ItemType | null>(null)

  const selectedConfig = selectedType 
    ? ITEM_TYPES.find(t => t.id === selectedType) 
    : null

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const renderFormFields = () => {
    if (!selectedType) return null

    const commonProps = {
      projectId: modalData?.projectId,
      organizationId: modalData?.organizationId,
      mode: 'create' as const,
      onSuccess: onClose,
      onCancel: onClose,
      hideActions: true,
      formRef,
    }

    switch (selectedType) {
      case 'board':
        return <BoardFormFields {...commonProps} />
      case 'pin':
        return <PinFormFields {...commonProps} />
      default:
        return null
    }
  }

  return (
    <ModalLayout 
      onClose={onClose} 
      size="lg"
      headerContent={
        <ModalHeader
          icon={selectedConfig?.icon || Palette}
          title={selectedConfig?.label ? `Nuevo ${selectedConfig.label}` : 'Agregar al Moodboard'}
          description={selectedConfig?.description || 'Selecciona qué deseas agregar'}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={selectedConfig?.submitLabel || 'Continuar'}
          onSubmit={handleSubmit}
          submitDisabled={!selectedType}
        />
      }
    >
      <ModalBody>
        <div className="space-y-1.5 w-full">
          <Label className="text-xs font-medium text-muted-foreground">¿Qué deseas agregar?</Label>
          <Select
            value={selectedType || ''}
            onValueChange={(value) => setSelectedType(value as ItemType)}
          >
            <SelectTrigger data-testid="select-moodboard-item-type">
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_TYPES.map((type) => {
                const IconComponent = type.icon
                
                return (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("w-4 h-4", type.color)} />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedType && (
          <div className="pt-4 border-t">
            {renderFormFields()}
          </div>
        )}
      </ModalBody>
    </ModalLayout>
  )
}

export default NewMoodboardItemModal
