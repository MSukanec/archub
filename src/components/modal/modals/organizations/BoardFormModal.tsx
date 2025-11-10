import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Kanban } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: board?.name || '',
      description: board?.description || ''
    }
  });

  React.useEffect(() => {
    if (board) {
      form.reset({
        name: board.name || '',
        description: board.description || ''
      });
      setPanel('edit');
    } else {
      form.reset({
        name: '',
        description: ''
      });
      setPanel('edit');
    }
  }, [board, form, setPanel]);

  const handleClose = () => {
    form.reset();
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
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar el tablero" : "No se pudo crear el tablero",
        variant: "destructive"
      });
    }
  };

  const viewPanel = (
    <>
      <div>
        <h4 className="font-medium">Nombre del tablero</h4>
        <p className="text-muted-foreground mt-1">{board?.name || 'Sin nombre'}</p>
      </div>
      
      <div>
        <h4 className="font-medium">Descripción</h4>
        <p className="text-muted-foreground mt-1">
          {board?.description || 'Sin descripción'}
        </p>
      </div>
    </>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del tablero</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Sin nombre"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Sin descripción"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
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
          form.handleSubmit(onSubmit)();
        }
      }}
      rightLoading={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
}