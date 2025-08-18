import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../../../form/FormModalHeader';
import { FormModalFooter } from '../../../form/FormModalFooter';
import { FormModalLayout } from '../../../form/FormModalLayout';
import FormModalBody from '../../../form/FormModalBody';
import { useModalPanelStore } from '../../../form/modalPanelStore';
import { useGlobalModalStore } from '../../../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite';
import { HandHeart } from 'lucide-react';

const partnerSchema = z.object({
  contactId: z.string().min(1, 'Debe seleccionar un contacto'),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerModalProps {
  editingPartner?: any;
  onClose: () => void;
}

export function PartnerModal({ editingPartner, onClose }: PartnerModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.preferences?.last_organization_id;

  // Query to get available contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      contactId: '',
    },
  });

  // Reset form when editing partner changes
  useEffect(() => {
    if (editingPartner) {
      form.reset({
        contactId: editingPartner.contact_id || '',
      });
      setPanel('edit');
    } else {
      form.reset({
        contactId: '',
      });
      setPanel('edit');
    }
  }, [editingPartner, form, setPanel]);

  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: PartnerFormData) => {
      if (!organizationId) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('partners')
        .insert({
          organization_id: organizationId,
          contact_id: partnerData.contactId,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast({
        title: 'Socio agregado',
        description: 'El socio ha sido agregado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al agregar socio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async (partnerData: PartnerFormData) => {
      if (!editingPartner?.id) throw new Error('Partner ID not found');

      const { data, error } = await supabase
        .from('partners')
        .update({
          contact_id: partnerData.contactId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPartner.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast({
        title: 'Socio actualizado',
        description: 'Los datos del socio han sido actualizados',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar socio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    closeModal();
    onClose();
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsLoading(true);
    try {
      if (editingPartner) {
        await updatePartnerMutation.mutateAsync(data);
      } else {
        await createPartnerMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsLoading(false);
    }
  };

  // Convert contacts to ComboBox options
  const contactOptions = contacts.map(contact => ({
    value: contact.id,
    label: `${contact.name} - ${contact.email}`,
  }));

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Contacto</label>
        <p className="text-sm">
          {contacts.find(c => c.id === form.getValues('contactId'))?.name || 'No seleccionado'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormModalBody>
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Contacto</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={contactOptions}
                    placeholder="Seleccionar contacto..."
                    searchPlaceholder="Buscar contacto..."
                    emptyMessage="No se encontraron contactos."
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormModalBody>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={editingPartner ? 'Editar Socio' : 'Ingresar Socio'}
      icon={HandHeart}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingPartner ? 'Actualizar' : 'Ingresar'}
      onRightClick={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
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
    />
  );
}