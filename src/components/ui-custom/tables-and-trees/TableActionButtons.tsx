import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface TableActionButtonsProps {
  // Botones principales que van en el popover
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  editLabel?: string
  deleteLabel?: string
  duplicateLabel?: string
  // Botones adicionales que van por fuera del popover
  additionalButtons?: React.ReactNode[]
  // Props para personalizar estilos
  className?: string
  disabled?: boolean
}

export function TableActionButtons({
  onEdit,
  onDelete,
  onDuplicate,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
  duplicateLabel = 'Duplicar',
  additionalButtons = [],
  className = '',
  disabled = false
}: TableActionButtonsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Botones adicionales (como el ojo) van primero */}
      {additionalButtons.map((button, index) => (
        <div key={index}>{button}</div>
      ))}
      
      {/* Botón de tres puntos con popover para acciones principales */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
            title="Más acciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="w-full justify-start gap-2 h-8"
              >
                <Edit className="h-4 w-4" />
                {editLabel}
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                className="w-full justify-start gap-2 h-8"
              >
                <Copy className="h-4 w-4" />
                {duplicateLabel}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="w-full justify-start gap-2 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLabel}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}