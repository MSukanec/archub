import React, { useState, useEffect } from 'react';
import { Edit, FileText, Calculator, Plus, Package, DollarSign, TrendingUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

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
  
  // TODO: Conectar con datos reales de subcontract_tasks
  const [awardedTasks, setAwardedTasks] = useState<any[]>([]);
  
  useEffect(() => {
    // TODO: Fetch real subcontract_tasks from the database
    // For now, always show empty array - no hardcoded data
    setAwardedTasks([]);
  }, [subcontract.id]);

  // Calcular KPIs basados en datos reales del subcontrato adjudicado
  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    const formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  };

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

  // Si está adjudicado pero no hay tareas, mostrar empty state específico
  if (isAwarded && awardedTasks.length === 0) {
    return (
      <div className="space-y-6">
        {/* KPIs del contrato adjudicado */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Monto Adjudicado</p>
                  <DollarSign className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {subcontract.amount_total 
                      ? formatCurrency(subcontract.amount_total, 'ARS')
                      : 'Sin definir'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Valor total del contrato
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Contratista</p>
                  <Package className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    Adjudicado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contrato en ejecución
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Tareas</p>
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    0
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sin tareas definidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Progreso</p>
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    0%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sin avance registrado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <EmptyState
          icon={<Package />}
          title="Sin tareas definidas"
          description="Este subcontrato está adjudicado pero no tiene tareas específicas definidas. Agrega tareas al alcance del subcontrato para ver los detalles del contrato aquí."
          action={
            <Button onClick={() => onTabChange?.('Alcance')}>
              <Plus className="w-4 h-4 mr-2" />
              Definir Alcance
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs del contrato adjudicado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Monto Adjudicado</p>
                <DollarSign className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {subcontract.amount_total 
                    ? formatCurrency(subcontract.amount_total, 'ARS')
                    : formatCurrency(calculateTotal(), 'ARS')
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Valor total del contrato
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tareas</p>
                <Package className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {awardedTasks.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tareas del contrato
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Estado</p>
                <TrendingUp className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                  Adjudicado
                </p>
                <p className="text-xs text-muted-foreground">
                  Contrato en ejecución
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Progreso</p>
                <Calculator className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  0%
                </p>
                <p className="text-xs text-muted-foreground">
                  Sin avance registrado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de tareas adjudicadas */}
      <Table
        data={awardedTasks}
        columns={columns}
        searchKey="task_name"
        searchPlaceholder="Buscar tareas adjudicadas..."
        rowActions={(item) => {
          if (editingTaskId === item.id) {
            return [
              {
                icon: Check,
                label: 'Guardar',
                onClick: () => handleSaveTask(item.id, item)
              },
              {
                icon: X,
                label: 'Cancelar',
                onClick: handleCancelEdit
              }
            ];
          }
          return [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEditTask(item.id)
            }
          ];
        }}
      />
    </div>
  );
}