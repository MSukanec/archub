import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  name: string;
  unit: string;
  unitPrice: number;
}

interface BudgetTask {
  id?: number;
  budgetId?: number;
  taskId: number;
  quantity: number;
  task?: Task;
}

interface EditBudgetTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetTask: BudgetTask | null;
  onSave: (budgetTaskId: number, quantity: number) => void;
}

export function EditBudgetTaskDialog({
  open,
  onOpenChange,
  budgetTask,
  onSave,
}: EditBudgetTaskDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState<number>(budgetTask?.quantity || 0);

  // Update local state when budgetTask changes
  if (budgetTask && budgetTask.quantity !== quantity) {
    setQuantity(budgetTask.quantity);
  }

  const handleSave = () => {
    if (!budgetTask?.id) {
      toast({
        title: "Error",
        description: "No se puede editar esta tarea",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }

    onSave(budgetTask.id, quantity);
    onOpenChange(false);
  };

  if (!budgetTask) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            Actualiza la cantidad para la tarea {budgetTask.task?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="task-name" className="col-span-1">
              Tarea
            </Label>
            <Input
              id="task-name"
              value={budgetTask.task?.name || ""}
              disabled
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="unit" className="col-span-1">
              Unidad
            </Label>
            <Input
              id="unit"
              value={budgetTask.task?.unit || ""}
              disabled
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="unit-price" className="col-span-1">
              Precio unitario
            </Label>
            <Input
              id="unit-price"
              value={new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS'
              }).format(budgetTask.task?.unitPrice || 0)}
              disabled
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="quantity" className="col-span-1">
              Cantidad
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
