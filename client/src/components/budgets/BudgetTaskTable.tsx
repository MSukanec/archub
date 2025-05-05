import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LucideTrash, LucidePencil } from "lucide-react";

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

interface BudgetTaskTableProps {
  budgetTasks: BudgetTask[];
  onRemoveTask: (index: number) => void;
  onEditTask?: (index: number, task: BudgetTask) => void;
  isEditing?: boolean;
}

export function BudgetTaskTable({ budgetTasks, onRemoveTask, onEditTask, isEditing = false }: BudgetTaskTableProps) {
  const [totals, setTotals] = useState({
    subtotal: 0,
  });

  // Calculate totals when budget tasks change
  useEffect(() => {
    const subtotal = budgetTasks.reduce((sum, item) => {
      const price = item.task?.unitPrice || 0;
      return sum + (price * item.quantity);
    }, 0);

    setTotals({
      subtotal,
    });
  }, [budgetTasks]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarea</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Precio Unitario</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                No hay tareas añadidas
              </TableCell>
            </TableRow>
          ) : (
            <>
              {budgetTasks.map((budgetTask, index) => {
                const subtotal = (budgetTask.task?.unitPrice || 0) * budgetTask.quantity;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{budgetTask.task?.name || '—'}</TableCell>
                    <TableCell>{budgetTask.quantity}</TableCell>
                    <TableCell>{budgetTask.task?.unit || '—'}</TableCell>
                    <TableCell>{formatCurrency(budgetTask.task?.unitPrice || 0)}</TableCell>
                    <TableCell>{formatCurrency(subtotal)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {isEditing && onEditTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => onEditTask(index, budgetTask)}
                          >
                            <LucidePencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => onRemoveTask(index)}
                        >
                          <LucideTrash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={4} className="text-right font-medium">
                  Total:
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(totals.subtotal)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
