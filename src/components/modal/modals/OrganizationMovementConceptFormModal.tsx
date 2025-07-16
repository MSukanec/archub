import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Tag, Plus, Folder } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateMovementConcept, useUpdateMovementConcept, MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin';

// Schema for form validation
const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  parent_id: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface OrganizationMovementConceptFormModalProps {
  editingConcept?: MovementConceptAdmin;
  parentConcept?: {
    id: string;
    name: string;
    parent_id: string | null;
    is_system: boolean;
  };
}

export function OrganizationMovementConceptFormModal({
  editingConcept,
  parentConcept
}: OrganizationMovementConceptFormModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  
  const createMutation = useCreateMovementConcept();
  const updateMutation = useUpdateMovementConcept();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingConcept?.name || '',
      parent_id: editingConcept?.parent_id || parentConcept?.id || undefined
    }
  });

  useEffect(() => {
    if (editingConcept) {
      form.reset({
        name: editingConcept.name,
        parent_id: editingConcept.parent_id || undefined
      });
    } else if (parentConcept) {
      form.reset({
        name: '',
        parent_id: parentConcept.id
      });
    }
  }, [editingConcept, parentConcept, form]);

  const onSubmit = async (data: FormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se encontró la organización',
        variant: 'destructive'
      });
      return;
    }

    // Check if editing a system concept (not allowed)
    if (editingConcept?.is_system) {
      toast({
        title: 'No permitido',
        description: 'No puedes modificar conceptos del sistema',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingConcept) {
        await updateMutation.mutateAsync({
          id: editingConcept.id,
          name: data.name,
          parent_id: data.parent_id || null
        });
        toast({
          title: 'Concepto actualizado',
          description: 'El concepto se ha actualizado correctamente'
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          parent_id: data.parent_id || null,
          organization_id: userData.organization.id,
          is_system: false
        });
        toast({
          title: 'Concepto creado',
          description: 'El concepto se ha creado correctamente'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar la solicitud',
        variant: 'destructive'
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Show warning for system concepts
  const isSystemConcept = editingConcept?.is_system;

  const viewPanel = (
    <div className="space-y-6">
      {isSystemConcept && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Tag className="h-4 w-4" />
              <span className="text-sm font-medium">Concepto del Sistema</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Este es un concepto predeterminado del sistema que no puede ser modificado.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Información del Concepto</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-sm">{editingConcept?.name || 'Nuevo concepto'}</p>
            </div>
            
            {parentConcept && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Concepto Padre</label>
                <div className="flex items-center gap-2 mt-1">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{parentConcept.name}</span>
                </div>
              </div>
            )}

            {editingConcept && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1">
                  <Badge variant={editingConcept.is_system ? "secondary" : "default"}>
                    {editingConcept.is_system ? 'Sistema' : 'Personalizado'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const editPanel = (
    <div className="space-y-6">
      {isSystemConcept && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <Tag className="h-4 w-4" />
              <span className="text-sm font-medium">Edición No Permitida</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Los conceptos del sistema no pueden ser modificados. Solo puedes editar conceptos personalizados de tu organización.
            </p>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Concepto *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Ej: Gastos de oficina"
                    disabled={isSystemConcept}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {parentConcept && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Concepto Padre</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{parentConcept.name}</span>
                <Badge variant="outline" className="text-xs">
                  {parentConcept.is_system ? 'Sistema' : 'Personalizado'}
                </Badge>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-2">
      <Tag className="h-5 w-5" />
      <span>
        {editingConcept 
          ? `${isSystemConcept ? 'Ver' : 'Editar'} Concepto` 
          : 'Nuevo Concepto'
        }
      </span>
    </div>
  );

  const footerContent = (
    <div className="flex items-center gap-2">
      {!isSystemConcept && (
        <Button 
          type="submit" 
          disabled={isPending}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isPending ? 'Guardando...' : (editingConcept ? 'Actualizar' : 'Crear')}
        </Button>
      )}
    </div>
  );

  return {
    viewPanel,
    editPanel,
    headerContent,
    footerContent
  };
}