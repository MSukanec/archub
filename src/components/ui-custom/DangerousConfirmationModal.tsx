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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-left">{title}</DialogTitle>
              <DialogDescription className="text-left text-base mt-2 leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {confirmationText}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="confirmation-input" className="text-sm font-medium text-foreground">
              Para confirmar, escribe: <span className="font-mono bg-muted px-2 py-1 rounded text-accent-foreground">{itemName}</span>
            </Label>
            <Input
              id="confirmation-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Escribe "${itemName}" para confirmar`}
              className="font-mono border-2 focus:border-destructive"
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
        
        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 max-w-[25%]"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="flex-1 max-w-[75%] bg-destructive hover:bg-destructive/90 text-white font-medium"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}