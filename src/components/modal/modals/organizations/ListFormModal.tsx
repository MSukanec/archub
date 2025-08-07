import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { List } from "lucide-react";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { FormModalLayout } from "../../form/FormModalLayout";
import FormModalBody from "../../form/FormModalBody";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateKanbanList, useUpdateKanbanList } from "@/hooks/use-kanban";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useToast } from "@/hooks/use-toast";
import { useModalPanelStore } from "../../form/modalPanelStore";

const listSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  created_by: z.string().min(1, "El creador es requerido"),
});

type ListFormData = z.infer<typeof listSchema>;

interface ListFormModalProps {
  modalData?: {
    boardId?: string;
    list?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ListFormModal({ modalData, onClose }: ListFormModalProps) {
  const { boardId, list, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const { setPanel } = useModalPanelStore();
  const createListMutation = useCreateKanbanList();
  const updateListMutation = useUpdateKanbanList();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: members = [] } = useOrganizationMembers(organizationId);

  // Convert members to users format for UserSelector
  const users = members.map(member => ({
    id: member.id, // Use member.id for created_by field
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url || undefined
  }));

  // Find current user's member ID for default selection
  const currentUserMember = members.find(member => member.user_id === userData?.user?.id);

  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: list?.name || '',
      created_by: list?.created_by || currentUserMember?.id || '',
    }
  });

  // Set current user as default creator when modal opens
  useEffect(() => {
    if (members.length > 0) {
      if (isEditing && list?.created_by) {
        // Set the creator from the editing list
        console.log('Setting creator for editing:', list.created_by);
        console.log('Available users:', users);
        form.setValue('created_by', list.created_by);
      } else if (currentUserMember && !form.watch('created_by')) {
        // Set current user as default for new lists
        console.log('Setting current user as creator:', currentUserMember.id);
        form.setValue('created_by', currentUserMember.id);
      }
    }
  }, [members, currentUserMember, list, isEditing, form, users]);

  // Set panel to edit mode when editing a list
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

  const onSubmit = async (data: ListFormData) => {
    if (!boardId) {
      toast({
        title: "Error",
        description: "No se pudo obtener el tablero",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditing && list) {
        await updateListMutation.mutateAsync({
          id: list.id,
          board_id: boardId,
          name: data.name,
          created_by: data.created_by
        });
        toast({
          title: "Lista actualizada",
          description: "La lista se ha actualizado correctamente",
        });
      } else {
        await createListMutation.mutateAsync({
          board_id: boardId,
          name: data.name,
          created_by: data.created_by
        });
        toast({
          title: "Lista creada",
          description: "La nueva lista se ha creado correctamente",
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving list:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar la lista" : "No se pudo crear la lista",
        variant: "destructive"
      });
    }
  };

  const editPanel = (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creador</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar creador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la lista</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Por Hacer"
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
      title={isEditing ? 'Editar Lista' : 'Nueva Lista'}
      icon={List}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Actualizar' : 'Guardar'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={createListMutation.isPending || updateListMutation.isPending}
      submitDisabled={createListMutation.isPending || updateListMutation.isPending}
    />
  );

  const viewPanel = isEditing ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre</h4>
        <p className="text-muted-foreground mt-1">{list?.name || 'Sin nombre'}</p>
      </div>
      <div>
        <h4 className="font-medium">Creador</h4>
        <p className="text-muted-foreground mt-1">
          {users.find(u => u.id === list?.created_by)?.full_name || 'Sin creador'}
        </p>
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
    />
  );
}