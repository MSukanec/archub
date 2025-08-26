import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { FormModalLayout } from "../../form/FormModalLayout";
import FormModalBody from "../../form/FormModalBody";
import { useModalPanelStore } from "../../form/modalPanelStore";
import { useGlobalModalStore } from "../../form/useGlobalModalStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import UserSelectorField from "@/components/ui-custom/fields/UserSelectorField";
import { useCreateKanbanCard, useUpdateKanbanCard } from "@/hooks/use-kanban";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useToast } from "@/hooks/use-toast";

const cardSchema = z.object({
  assigned_to: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardFormModalProps {
  modalData?: {
    listId?: string;
    card?: any;
    isEditing?: boolean;
    boardId?: string;
  };
  onClose: () => void;
}

export function CardFormModal({ modalData, onClose }: CardFormModalProps) {
  const { listId, card, isEditing = false, boardId } = modalData || {};
  const { toast } = useToast();
  const { setPanel } = useModalPanelStore();
  const createCardMutation = useCreateKanbanCard();
  const updateCardMutation = useUpdateKanbanCard();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);

  // Convert members to users format for UserSelector
  const users = members.map(member => ({
    id: member.id, // Use organization member ID, not user_id
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url
  }));

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      assigned_to: card?.assigned_to || '',
      title: card?.title || '',
      description: card?.description || '',
    }
  });



  // Set panel to edit mode when editing a card
  useEffect(() => {
    if (isEditing) {
      setPanel('edit');
    }
  }, [isEditing, setPanel]);

  const handleClose = () => {
    form.reset();
    setPanel('edit'); // Reset to edit panel
    onClose();
  };

  const onSubmit = async (data: CardFormData) => {
    try {
      if (isEditing && card) {
        // Update existing card
        await updateCardMutation.mutateAsync({
          id: card.id,
          title: data.title,
          description: data.description || undefined,
          assigned_to: data.assigned_to || undefined,
          list_id: card.list_id
        });
        
        handleClose();
        toast({
          title: "Tarjeta actualizada",
          description: "La tarjeta se ha actualizado exitosamente"
        });
      } else {
        // Create new card
        if (!listId) {
          toast({
            title: "Error",
            description: "No se pudo identificar la lista",
            variant: "destructive"
          });
          return;
        }

        // Find current user's organization member ID
        const currentMember = members.find(m => m.user_id === userData?.user?.id);
        
        if (!currentMember?.id) {
          toast({
            title: "Error",
            description: "No se pudo identificar el usuario actual",
            variant: "destructive"
          });
          return;
        }
        
        await createCardMutation.mutateAsync({
          list_id: listId,
          title: data.title,
          description: data.description || undefined,
          created_by: currentMember.id, // Use current user's member ID automatically
          assigned_to: data.assigned_to || undefined, // Already using organization member ID
          board_id: boardId // Pass boardId to avoid additional query
        });
        
        handleClose();
        toast({
          title: "Tarjeta creada",
          description: "La tarjeta se ha creado exitosamente"
        });
      }
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar la tarjeta" : "No se pudo crear la tarjeta",
        variant: "destructive"
      });
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asignado a (opcional)</FormLabel>
              <FormControl>
                <UserSelectorField
                  users={users}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Sin asignar"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Escribir documentación"
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
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detalles adicionales sobre la tarea..."
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
      title={isEditing ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Actualizar' : 'Crear Tarjeta'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={createCardMutation.isPending || updateCardMutation.isPending}
    />
  );

  const viewPanel = isEditing ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Asignado a</h4>
        <p className="text-muted-foreground mt-1">{card?.assignedUser?.full_name || 'Sin asignar'}</p>
      </div>
      <div>
        <h4 className="font-medium">Título</h4>
        <p className="text-muted-foreground mt-1">{card?.title || 'Sin título'}</p>
      </div>
      <div>
        <h4 className="font-medium">Descripción</h4>
        <p className="text-muted-foreground mt-1">{card?.description || 'Sin descripción'}</p>
      </div>
    </div>
  ) : editPanel;

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