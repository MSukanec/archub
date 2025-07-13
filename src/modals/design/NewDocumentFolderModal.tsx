import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { CustomModalLayout } from '@/components/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/CustomModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserSelector from '@/components/ui-custom/UserSelector';
import { FolderOpen } from 'lucide-react';

const formSchema = z.object({
  created_by: z.string().min(1, 'El creador es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
});

type FormData = z.infer<typeof formSchema>;

interface NewDocumentFolderModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewDocumentFolderModal({ open, onClose }: NewDocumentFolderModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  const createFolderMutation = useCreateDesignDocumentFolder();

  // Debug logs
  console.log('NewDocumentFolderModal - userData:', userData);
  console.log('NewDocumentFolderModal - members:', members);
  console.log('NewDocumentFolderModal - organizationId:', organizationId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      created_by: userData?.user?.id || '',
      name: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && userData?.user?.id) {
      form.reset({
        created_by: userData.user.id,
        name: '',
      });
    }
  }, [open, userData, form]);

  const handleSubmit = async (values: FormData) => {
    console.log('handleSubmit called with values:', values);
    try {
      await createFolderMutation.mutateAsync({
        name: values.name,
        created_by: values.created_by
      });
      toast({
        title: "Carpeta creada",
        description: "La carpeta ha sido creada exitosamente."
      });
      
      form.reset();
      onClose();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la carpeta",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    console.log('handleCancel called');
    form.reset();
    onClose();
  };

  const isLoading = createFolderMutation.isPending;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title="Nueva Carpeta"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                
                {/* Creado por */}
                <FormField
                  control={form.control}
                  name="created_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creado por <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <UserSelector
                          users={members.map(member => ({
                            id: member.user_id,
                            full_name: member.full_name,
                            email: member.email,
                            avatar_url: member.avatar_url
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona el creador"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la carpeta <span className="text-[var(--accent)]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Planos arquitectónicos, Documentos legales, etc."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleCancel}
            onSave={form.handleSubmit(handleSubmit)}
            saveText="Guardar"
            isLoading={isLoading}
          />
        )
      }}
    </CustomModalLayout>
  );
}