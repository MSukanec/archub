import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
import { FormModalLayout } from "../form/FormModalLayout";
import { FormModalHeader } from "../form/FormModalHeader";
import { FormModalFooter } from "../form/FormModalFooter";
import FormModalBody from "../form/FormModalBody";
import { useModalPanelStore } from "../form/modalPanelStore";
import { useGlobalModalStore } from "../form/useGlobalModalStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import UserSelector from "@/components/ui-custom/UserSelector";
import { useCreateKanbanCard } from "@/hooks/use-kanban";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useToast } from "@/hooks/use-toast";

const cardSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  created_by: z.string().min(1, "El creador es requerido"),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardFormModalProps {
  modalData?: {
    listId?: string;
    card?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CardFormModal({ modalData, onClose }: CardFormModalProps) {
  const { listId, card, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const { setPanel } = useModalPanelStore();
  const createCardMutation = useCreateKanbanCard();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);

  // Convert members to users format for UserSelector
  const users = members.map(member => ({
    id: member.user_id,
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url
  }));

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: card?.title || '',
      description: card?.description || '',
      created_by: card?.created_by || userData?.user?.id || '',
      assigned_to: card?.assigned_to || '',
      due_date: card?.due_date || '',
    }
  });

  // Set current user as default creator when modal opens
  useEffect(() => {
    if (!isEditing && userData?.user?.id) {
      form.setValue('created_by', userData.user.id);
    }
  }, [userData?.user?.id, form, isEditing]);

  const handleClose = () => {
    form.reset();
    setPanel('edit'); // Reset to edit panel
    onClose();
  };

  const onSubmit = async (data: CardFormData) => {
    if (!listId) {
      toast({
        title: "Error",
        description: "No se pudo identificar la lista",
        variant: "destructive"
      });
      return;
    }

    try {
      await createCardMutation.mutateAsync({
        list_id: listId,
        title: data.title,
        description: data.description || undefined,
        created_by: data.created_by,
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined
      });
      
      handleClose();
      toast({
        title: "Tarjeta creada",
        description: "La tarjeta se ha creado exitosamente"
      });
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarjeta",
        variant: "destructive"
      });
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creador</FormLabel>
              <FormControl>
                <UserSelector
                  users={users}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar creador"
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

        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asignado a (opcional)</FormLabel>
              <FormControl>
                <UserSelector
                  users={users}
                  value={field.value}
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
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha límite (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
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
      rightLoading={createCardMutation.isPending}
    />
  );

  return {
    editPanel,
    headerContent,
    footerContent
  };
}