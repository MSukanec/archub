import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

interface DangerousConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  confirmationText?: string
  isLoading?: boolean
}

export function DangerousConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmationText = "Esta acción no se puede deshacer",
  isLoading = false
}: DangerousConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('')
  
  const isValid = inputValue.trim() === itemName.trim()
  
  const handleConfirm = () => {
    if (isValid) {
      onConfirm()
    }
  }
  
  const handleClose = () => {
    setInputValue('')
    onClose()
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
              <DialogDescription className="text-left">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ {confirmationText}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Escribe <span className="font-mono bg-muted px-1 rounded">{itemName}</span> para confirmar:
            </Label>
            <Input
              id="confirmation-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Escribe "${itemName}" aquí`}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}