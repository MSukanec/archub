import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Kanban } from 'lucide-react';
import { FormModalLayout } from '../form/FormModalLayout';
import { FormModalHeader } from '../form/FormModalHeader';
import { FormModalFooter } from '../form/FormModalFooter';
import { useModalPanelStore } from '../form/modalPanelStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateKanbanBoard, useUpdateKanbanBoard } from '@/hooks/use-kanban';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useToast } from '@/hooks/use-toast';

const boardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface BoardFormModalProps {
  modalData?: {
    board?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function BoardFormModal({ modalData, onClose }: BoardFormModalProps) {
  const { board, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { setCurrentBoardId } = useKanbanStore();
  const createBoardMutation = useCreateKanbanBoard();
  const updateBoardMutation = useUpdateKanbanBoard();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: board?.name || '',
      description: board?.description || ''
    }
  });

  React.useEffect(() => {
    reset({
      name: board?.name || '',
      description: board?.description || ''
    });
  }, [board, reset]);

  const handleClose = () => {
    reset();
    setPanel('view');
    onClose();
  };

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
      if (isEditing && board) {
        await updateBoardMutation.mutateAsync({
          id: board.id,
          name: data.name,
          description: data.description || undefined
        });
        toast({
          title: "Tablero actualizado",
          description: "El tablero se ha actualizado correctamente"
        });
      } else {
        const newBoard = await createBoardMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined
        });
        // Auto-select the newly created board
        setCurrentBoardId(newBoard.id);
        toast({
          title: "Tablero creado",
          description: "El tablero se ha creado correctamente"
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving board:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar el tablero" : "No se pudo crear el tablero",
        variant: "destructive"
      });
    }
  };

  const viewPanel = (
    <div className="p-6 space-y-4">
      <div>
        <Label className="text-sm font-medium">Nombre del tablero</Label>
        <p className="text-sm text-muted-foreground mt-1">{board?.name || 'Sin nombre'}</p>
      </div>
      
      <div>
        <Label className="text-sm font-medium">Descripción</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {board?.description || 'Sin descripción'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <div className="p-6">
      <form id="board-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre del tablero *</Label>
          <Input 
            id="name"
            {...register('name')}
            placeholder="Cosas para Hacer"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea 
            id="description"
            {...register('description')}
            placeholder="Describe el propósito de este tablero..."
            rows={3}
            className="mt-1"
          />
        </div>
      </form>
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Tablero" : "Nuevo Tablero de Ideas"}
      icon={Kanban}
      leftActions={
        currentPanel === 'edit' && isEditing ? (
          <button
            type="button"
            onClick={() => setPanel('view')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
        ) : undefined
      }
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Tablero" : "Crear Tablero"}
      onRightClick={() => {
        if (currentPanel === 'view' && isEditing) {
          setPanel('edit');
        } else {
          const form = document.getElementById('board-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
      }}
      rightLoading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}