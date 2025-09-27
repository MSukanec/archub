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
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrencies } from '@/hooks/use-currencies';
import { supabase } from '@/lib/supabase';
// Removed navigationStore import - using userData.preferences.last_project_id instead;

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.string().min(1, 'El estado es requerido'),
  version: z.number().min(1, 'La versión debe ser mayor a 0'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.number().optional(),
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
  console.log('🔥 BudgetFormModal rendering with modalData:', modalData);
  const { budget, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { data: members } = useOrganizationMembers(userData?.organization?.id);
  const { data: currencies } = useCurrencies();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!budget;
  console.log('🔥 BudgetFormModal isEditing:', isEditing, 'budget:', budget);

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: budget?.name || '',
      description: budget?.description || '',
      status: budget?.status || 'draft',
      version: budget?.version || 1,
      currency_id: budget?.currency_id || (currencies?.[0]?.id || ''),
      exchange_rate: budget?.exchange_rate || undefined,
      created_at: budget?.created_at ? new Date(budget.created_at) : new Date()
    }
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        name: budget.name || '',
        description: budget.description || '',
        status: budget.status || 'draft',
        version: budget.version || 1,
        currency_id: budget.currency_id || (currencies?.[0]?.id || ''),
        exchange_rate: budget.exchange_rate || undefined,
        created_at: budget.created_at ? new Date(budget.created_at) : new Date()
      });
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'draft',
        version: 1,
        currency_id: currencies?.[0]?.id || '',
        exchange_rate: undefined,
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

      // Find current member ID from organization members
      const currentMember = members?.find(member => member.user_id === userData.user.id)
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización')
      }

      const budgetData = {
        name: data.name,
        description: data.description || null,
        project_id: userData.preferences.last_project_id,
        organization_id: userData.organization.id,
        status: data.status,
        version: data.version,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate || null,
        created_at: data.created_at.toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentMember.id
      };

      // Get the authentication token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`
      };

      if (isEditing && budget) {
        // Use server endpoint for updating
        const response = await fetch(`/api/budgets/${budget.id}`, {
          method: 'PATCH',
          headers,
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
          headers,
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
        <h4 className="font-medium">Versión</h4>
        <p className="text-muted-foreground mt-1">{budget?.version || 'Sin versión'}</p>
      </div>

      <div>
        <h4 className="font-medium">Moneda</h4>
        <p className="text-muted-foreground mt-1">
          {currencies?.find(c => c.id === budget?.currency_id)?.code || 'Sin moneda'}
        </p>
      </div>

      {budget?.exchange_rate && (
        <div>
          <h4 className="font-medium">Tipo de cambio</h4>
          <p className="text-muted-foreground mt-1">{budget.exchange_rate}</p>
        </div>
      )}

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

        {/* Versión */}
        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="required-asterisk">Versión</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Moneda */}
        <FormField
          control={form.control}
          name="currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="required-asterisk">Moneda</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de cambio */}
        <FormField
          control={form.control}
          name="exchange_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de cambio (opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.000001"
                  placeholder="1.0"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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