import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, X } from "lucide-react"

interface DangerousConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmationText: string
  buttonText?: string
  isLoading?: boolean
}

export default function DangerousConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationText,
  buttonText = "Eliminar",
  isLoading = false
}: DangerousConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('')

  const handleClose = () => {
    setInputValue('')
    onClose()
  }

  const handleConfirm = () => {
    if (inputValue === confirmationText) {
      onConfirm()
      setInputValue('')
    }
  }

  const isConfirmDisabled = inputValue !== confirmationText || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-red-900">
                {title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription className="text-sm text-muted-foreground mb-4">
          {description}
        </DialogDescription>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  ¡Atención! Esta acción no se puede deshacer
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Para confirmar, escribe <span className="font-mono font-semibold bg-red-100 px-1 rounded">
                    {confirmationText}
                  </span> en el campo de abajo.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Confirmar acción
            </Label>
            <Input
              id="confirmation-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Escribe "${confirmationText}"`}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-6">
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
            disabled={isConfirmDisabled}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </div>
            ) : (
              buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}