import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Removed navigationStore import - using userData.preferences.last_project_id instead;

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.string().min(1, 'El estado es requerido'),
  created_at: z.date()
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormModalProps {
  modalData?: {
    budget?: any;
    isEditing?: boolean;
    onSuccess?: (budgetId: string) => void;
  };
  onClose: () => void;
}

export function BudgetFormModal({ modalData, onClose }: BudgetFormModalProps) {
  const { budget, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!budget;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: budget?.name || '',
      description: budget?.description || '',
      status: budget?.status || 'draft',
      created_at: budget?.created_at ? new Date(budget.created_at) : new Date()
    }
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        name: budget.name || '',
        description: budget.description || '',
        status: budget.status || 'draft',
        created_at: budget.created_at ? new Date(budget.created_at) : new Date()
      });
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'draft',
        created_at: new Date()
      });
    }
    setPanel('edit');
  }, [budget, form, setPanel]);

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Missing required data');
      }

      const budgetData = {
        name: data.name,
        description: data.description || null,
        project_id: userData.preferences.last_project_id,
        organization_id: userData.organization.id,
        status: data.status,
        created_at: data.created_at.toISOString(),
        created_by: "8016e8bb-b49e-4f6f-8616-0e1a6d0fc506" // Using the organization_member ID from the logs
      };

      if (isEditing && budget) {
        // Use server endpoint for updating
        const response = await fetch(`/api/budgets/${budget.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      } else {
        // Use server endpoint for creating
        const response = await fetch('/api/budgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: isEditing ? "Presupuesto actualizado" : "Presupuesto creado",
        description: isEditing 
          ? "El presupuesto ha sido actualizado correctamente"
          : "El presupuesto ha sido creado correctamente",
      });
      
      // Call onSuccess callback with new budget ID for auto-expansion
      if (!isEditing && result?.id && onSuccess) {
        onSuccess(result.id);
      }
      
      handleClose();
    },
    onError: (error) => {
      console.error('Error saving budget:', error);
      toast({
        title: "Error",
        description: isEditing 
          ? "No se pudo actualizar el presupuesto"
          : "No se pudo crear el presupuesto",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    form.reset();
    setPanel('view');
    onClose();
  };

  const onSubmit = async (data: BudgetFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la organización",
        variant: "destructive"
      });
      return;
    }

    createBudgetMutation.mutate(data);
  };

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre del presupuesto</h4>
        <p className="text-muted-foreground mt-1">{budget?.name || 'Sin nombre'}</p>
      </div>
      
      <div>
        <h4 className="font-medium">Descripción</h4>
        <p className="text-muted-foreground mt-1">{budget?.description || 'Sin descripción'}</p>
      </div>

      <div>
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">
          {budget?.status === 'draft' ? 'Borrador' : 
           budget?.status === 'approved' ? 'Aprobado' : 
           budget?.status === 'in_progress' ? 'En progreso' : 
           budget?.status === 'completed' ? 'Completado' : 
           budget?.status || 'Sin estado'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Fecha de creación</h4>
        <p className="text-muted-foreground mt-1">
          {budget?.created_at ? new Date(budget.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha de creación */}
        <FormField
          control={form.control}
          name="created_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="required-asterisk">Fecha de creación</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    // Parse as local date to avoid UTC timezone shifts
                    const localDate = new Date(e.target.value + 'T00:00:00');
                    field.onChange(localDate);
                  }}
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
              <FormLabel className="required-asterisk">Nombre del presupuesto</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej. Presupuesto de construcción principal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe brevemente el alcance de este presupuesto..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="required-asterisk">Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
      icon={Calculator}
    />
  );

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleClose}
      submitText={createBudgetMutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Presupuesto")}
      onSubmit={form.handleSubmit(onSubmit)}
      submitDisabled={createBudgetMutation.isPending}
      showLoadingSpinner={createBudgetMutation.isPending}
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