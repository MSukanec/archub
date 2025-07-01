import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateDesignTask } from '@/hooks/use-design-tasks';
import { useToast } from '@/hooks/use-toast';

interface DesignPhase {
  id: string;
  name: string;
  description: string | null;
}

interface SimpleDesignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DesignPhase[];
}

export function SimpleDesignTaskModal({ isOpen, onClose, phases }: SimpleDesignTaskModalProps) {
  const [formData, setFormData] = useState({
    design_phase_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'pending' as const
  });

  const createTaskMutation = useCreateDesignTask();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.design_phase_id || !formData.name) {
      toast({
        title: 'Error',
        description: 'Selecciona una fase y completa el nombre de la tarea.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        design_phase_id: formData.design_phase_id,
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status
      });
      
      toast({
        title: 'Tarea creada',
        description: 'La tarea de diseño se creó correctamente.',
      });
      
      setFormData({
        design_phase_id: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'pending'
      });
      onClose();
    } catch (error) {
      console.error('Error creating design task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea. Intenta nuevamente.',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setFormData({
      design_phase_id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'pending'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea de Diseño</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase">Fase de Diseño *</Label>
            <Select
              value={formData.design_phase_id}
              onValueChange={(value) => setFormData({ ...formData, design_phase_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una fase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Tarea *</Label>
            <Input
              id="name"
              placeholder="Ej: Relevamiento del terreno"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe los detalles de la tarea..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de Finalización</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Por hacer</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={createTaskMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}