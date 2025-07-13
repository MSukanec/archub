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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      created_by: userData?.id || '',
      name: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        created_by: userData?.id || '',
        name: '',
      });
    }
  }, [open, userData, form]);

  const handleSubmit = async (values: FormData) => {
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
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la carpeta",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
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
                          users={members}
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
          <CustomModalFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Carpeta'}
            </Button>
          </CustomModalFooter>
        )
      }}
    </CustomModalLayout>
  );
}