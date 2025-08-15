import React, { useState, useEffect } from 'react';
import { Edit, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/Table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { EmptyState } from '@/components/ui-custom/EmptyState';

interface SubcontractAwardedViewProps {
  subcontract: any;
  onTabChange?: (tab: string) => void;
}

export function SubcontractAwardedView({ subcontract, onTabChange }: SubcontractAwardedViewProps) {
  const { openModal } = useGlobalModalStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTasks, setEditedTasks] = useState<any[]>([]);
  
  // Determinar si hay adjudicación
  const isAwarded = subcontract?.winner_bid_id && subcontract?.status === 'awarded';
  
  // Mock data para tareas - TODO: Replace with real data from subcontract_bid_tasks
  const [awardedTasks, setAwardedTasks] = useState<any[]>([]);
  
  useEffect(() => {
    // TODO: Fetch subcontract_bid_tasks from the awarded bid
    // For now, when awarded, show mock tasks
    if (isAwarded) {
      setAwardedTasks([
        {
          id: '1',
          task_name: 'Excavación general',
          task_description: 'Excavación para fundaciones',
          amount: 100,
          unit: 'm³',
          unit_price: 1500,
          notes: 'Incluye retiro de material'
        },
        {
          id: '2', 
          task_name: 'Hormigón armado',
          task_description: 'Fundaciones y columnas',
          amount: 50,
          unit: 'm³',
          unit_price: 8500,
          notes: 'H-25 con aditivo'
        }
      ]);
    } else {
      setAwardedTasks([]);
    }
  }, [subcontract.id, isAwarded]);

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveTask = (taskId: string, updatedData: any) => {
    // TODO: Update subcontract_bid_tasks and recalculate subcontract.amount_total
    setEditingTaskId(null);
    console.log('Saving task:', taskId, updatedData);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleUploadContract = () => {
    // TODO: Implement contract upload functionality
    console.log('Upload contract functionality to be implemented');
  };

  const calculateTotal = () => {
    return awardedTasks.reduce((total, task) => {
      const amount = task.amount || 0;
      const unitPrice = task.unit_price || 0;
      return total + (amount * unitPrice);
    }, 0);
  };

  const columns = [
    {
      key: 'task_name',
      label: 'Tarea',
      render: (item: any) => (
        <div>
          <p className="font-medium text-sm">
            {item.task_name || 'Sin nombre'}
          </p>
          {item.task_description && (
            <p className="text-xs text-muted-foreground">{item.task_description}</p>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Cantidad',
      render: (item: any) => {
        if (editingTaskId === item.id) {
          return (
            <Input
              type="number"
              defaultValue={item.amount}
              className="w-20 h-8"
              min="0"
              step="0.01"
            />
          );
        }
        return (
          <span className="text-sm font-medium">
            {item.amount ? item.amount.toLocaleString('es-AR') : '—'}
          </span>
        );
      }
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.unit || item.unit_symbol || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'unit_price',
      label: 'Precio Unitario',
      render: (item: any) => {
        if (editingTaskId === item.id) {
          return (
            <Input
              type="number"
              defaultValue={item.unit_price}
              className="w-24 h-8"
              min="0"
              step="0.01"
            />
          );
        }
        return (
          <span className="text-sm font-medium">
            {item.unit_price ? `$${item.unit_price.toLocaleString('es-AR')}` : '—'}
          </span>
        );
      }
    },
    {
      key: 'total',
      label: 'Importe',
      render: (item: any) => {
        const total = (item.amount || 0) * (item.unit_price || 0);
        return (
          <span className="text-sm font-medium">
            {total > 0 ? `$${total.toLocaleString('es-AR')}` : '—'}
          </span>
        );
      }
    },
    {
      key: 'notes',
      label: 'Notas',
      render: (item: any) => {
        if (editingTaskId === item.id) {
          return (
            <Textarea
              defaultValue={item.notes}
              className="w-32 h-8 min-h-8 resize-none"
              placeholder="Notas..."
            />
          );
        }
        return (
          <span className="text-sm text-muted-foreground">
            {item.notes || '—'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          {editingTaskId === item.id ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handleSaveTask(item.id, item)}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleEditTask(item.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  if (!isAwarded) {
    return (
      <EmptyState
        icon={<FileText />}
        title="Sin adjudicación"
        description="Este subcontrato aún no ha sido adjudicado. Una vez adjudicado, podrás ver y editar los detalles del contrato aquí."
        action={
          <Button onClick={() => onTabChange?.('Ofertas')}>
            <FileText className="w-4 h-4 mr-2" />
            Ir a Ofertas
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabla de tareas adjudicadas */}
      <Table
        data={awardedTasks}
        columns={columns}
        searchKey="task_name"
        searchPlaceholder="Buscar tareas adjudicadas..."
      />

      {/* Card de totales */}
      <Card>
        <CardHeader 
          icon={Calculator}
          title="Totales del Contrato"
          description="Resumen financiero del subcontrato adjudicado"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Cantidad de Tareas</p>
                <p className="text-lg font-bold">{awardedTasks.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Total del Contrato</p>
                <p className="text-lg font-bold text-primary">
                  ${calculateTotal().toLocaleString('es-AR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Estado</p>
                <Badge variant="default">Adjudicado</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}