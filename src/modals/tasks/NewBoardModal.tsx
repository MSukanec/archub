import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateKanbanBoard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';

const boardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface NewBoardModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewBoardModal({ open, onClose }: NewBoardModalProps) {
  const { data: userData } = useCurrentUser();
  const createBoardMutation = useCreateKanbanBoard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const onSubmit = async (data: BoardFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la organización",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBoardMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        project_id: userData.preferences?.last_project_id || undefined
      });

      toast({
        title: "Éxito",
        description: "Tablero creado correctamente"
      });

      reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el tablero",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Tablero Kanban</DialogTitle>
          <DialogDescription>
            Crea un nuevo tablero para organizar tus tareas con listas y tarjetas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del tablero</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Desarrollo de Producto"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe el propósito de este tablero..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createBoardMutation.isPending}
            >
              {createBoardMutation.isPending ? 'Creando...' : 'Crear Tablero'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}