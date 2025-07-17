import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, ArrowUpDown, ArrowRightLeft } from 'lucide-react';
import { FormModalHeader } from '../form/FormModalHeader';
import { FormModalFooter } from '../form/FormModalFooter';
import { FormModalLayout } from '../form/FormModalLayout';
import { useModalPanelStore } from '../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import UserSelector from '@/components/ui-custom/UserSelector';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useOrganizationWallets } from '@/hooks/use-organization-wallets';
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Esquemas de validación
const movementSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  subcategory_id: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface MovementFormModalProps {
  modalData?: {
    movement?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

function MovementFormModal({ modalData, onClose }: MovementFormModalProps) {
  const { movement: editingMovement, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { data: members } = useOrganizationMembers(userData?.organization?.id || '');
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id || '');
  const { data: wallets } = useOrganizationWallets(userData?.organization?.id || '');
  const { data: organizationConcepts } = useOrganizationMovementConcepts(userData?.organization?.id || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Crear mutación para crear movimiento
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementFormData & { organization_id: string, project_id: string | null }) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data: newMovement, error } = await supabase
        .from('movements')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    }
  });

  // Crear mutación para actualizar movimiento
  const updateMovementMutation = useMutation({
    mutationFn: async ({ id, ...data }: MovementFormData & { id: string, organization_id: string, project_id: string | null }) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data: updatedMovement, error } = await supabase
        .from('movements')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    }
  });

  // Estado para el tipo de movimiento
  const [movementType, setMovementType] = React.useState<'normal' | 'conversion' | 'transfer' | 'aportes' | 'aportes_propios' | 'retiros_propios'>('normal');

  // Verificar que todos los datos estén cargados
  const loadingReady = !!(members && currencies && wallets && organizationConcepts);

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || userData?.user?.id || '',
      description: editingMovement?.description || '',
      amount: editingMovement?.amount || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined,
      type_id: editingMovement?.type_id || '',
      currency_id: editingMovement?.currency_id || '',
      wallet_id: editingMovement?.wallet_id || '',
      subcategory_id: editingMovement?.subcategory_id || '',
    }
  });

  React.useEffect(() => {
    if (editingMovement) {
      form.reset({
        movement_date: new Date(editingMovement.movement_date),
        created_by: editingMovement.created_by,
        description: editingMovement.description || '',
        amount: editingMovement.amount,
        exchange_rate: editingMovement.exchange_rate || undefined,
        type_id: editingMovement.type_id,
        currency_id: editingMovement.currency_id,
        wallet_id: editingMovement.wallet_id,
        subcategory_id: editingMovement.subcategory_id || '',
      });
      setPanel('edit');
    } else {
      setPanel('edit');
    }
  }, [editingMovement, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setPanel('edit');
    onClose();
  };

  const onSubmit = async (data: MovementFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la organización",
        variant: "destructive"
      });
      return;
    }

    try {
      const movementData = {
        ...data,
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
      };

      if (editingMovement) {
        await updateMovementMutation.mutateAsync({
          id: editingMovement.id,
          ...movementData
        });
        toast({
          title: "Éxito",
          description: "Movimiento actualizado correctamente"
        });
      } else {
        await createMovementMutation.mutateAsync(movementData);
        toast({
          title: "Éxito",
          description: "Movimiento creado correctamente"
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving movement:', error);
      toast({
        title: "Error",
        description: "Error al guardar el movimiento",
        variant: "destructive"
      });
    }
  };

  // Obtener categorías y subcategorías de la estructura jerárquica
  const categories = organizationConcepts || [];
  const allSubcategories = categories.flatMap((concept: any) => concept.children || []);

  const selectedCategoryId = form.watch('type_id');
  const selectedCategory = categories.find((cat: any) => cat.id === selectedCategoryId);
  const availableSubcategories = selectedCategory?.children || [];

  // Encontrar datos para display
  const selectedCurrency = currencies?.find(c => c.currency?.id === form.watch('currency_id'))?.currency;
  const selectedWallet = wallets?.find(w => w.id === form.watch('wallet_id'))?.wallets;
  const selectedCreator = members?.find(m => m.id === form.watch('created_by'));
  const selectedConcept = categories.find((c: any) => c.id === form.watch('type_id')) || 
                          allSubcategories.find((c: any) => c.id === form.watch('type_id'));

  const viewPanel = editingMovement ? (
    <>
      <div>
        <h4 className="font-medium">Creador</h4>
        <p className="text-muted-foreground mt-1">
          {selectedCreator ? `${selectedCreator.first_name} ${selectedCreator.last_name || ''}`.trim() : 'Sin creador'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Fecha</h4>
        <p className="text-muted-foreground mt-1">
          {editingMovement.movement_date ? 
            format(new Date(editingMovement.movement_date), 'PPP', { locale: es }) : 
            'Sin fecha'
          }
        </p>
      </div>

      <div>
        <h4 className="font-medium">Tipo</h4>
        <p className="text-muted-foreground mt-1">
          {selectedConcept?.name || 'Sin tipo'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Moneda</h4>
        <p className="text-muted-foreground mt-1">
          {selectedCurrency?.name || 'Sin moneda'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Billetera</h4>
        <p className="text-muted-foreground mt-1">
          {selectedWallet?.name || 'Sin billetera'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Monto</h4>
        <p className="text-muted-foreground mt-1">
          {editingMovement.amount ? 
            `${selectedCurrency?.symbol || '$'} ${editingMovement.amount.toLocaleString()}` : 
            'Sin monto'
          }
        </p>
      </div>

      {editingMovement.exchange_rate && (
        <div>
          <h4 className="font-medium">Cotización</h4>
          <p className="text-muted-foreground mt-1">{editingMovement.exchange_rate}</p>
        </div>
      )}

      {editingMovement.description && (
        <div>
          <h4 className="font-medium">Descripción</h4>
          <p className="text-muted-foreground mt-1">{editingMovement.description}</p>
        </div>
      )}
    </>
  ) : null;

  const editPanel = (
    <div className="space-y-4">
      {!loadingReady ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando formulario...</div>
        </div>
      ) : (
        <>
          {/* Selector de tipo de movimiento - Solo para nuevos movimientos */}
          {!editingMovement && (
            <div className="mb-6">
              <FormLabel className="text-base font-medium mb-3 block">Tipo de Movimiento</FormLabel>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={movementType === 'normal' ? 'default' : 'outline'}
                  onClick={() => setMovementType('normal')}
                  className="h-auto py-3 px-4"
                >
                  <div className="text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-medium">Normal</div>
                    <div className="text-xs text-muted-foreground">Ingreso/Egreso</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={movementType === 'conversion' ? 'default' : 'outline'}
                  onClick={() => setMovementType('conversion')}
                  className="h-auto py-3 px-4"
                >
                  <div className="text-center">
                    <ArrowUpDown className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-medium">Conversión</div>
                    <div className="text-xs text-muted-foreground">Entre monedas</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={movementType === 'transfer' ? 'default' : 'outline'}
                  onClick={() => setMovementType('transfer')}
                  className="h-auto py-3 px-4"
                >
                  <div className="text-center">
                    <ArrowRightLeft className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-medium">Transferencia</div>
                    <div className="text-xs text-muted-foreground">Entre billeteras</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Formulario principal */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Fila 1: Creador | Fecha */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="created_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creador *</FormLabel>
                      <FormControl>
                        <UserSelector
                          users={members || []}
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
                  name="movement_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const localDate = new Date(e.target.value + 'T00:00:00');
                            field.onChange(localDate);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fila 2: Tipo | Subcategoría */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedCategoryId ? "Seleccione primero un tipo" : "Seleccionar subcategoría..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSubcategories.map((subcategory: any) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fila 3: Moneda | Billetera */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar moneda..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies?.map((currency) => (
                            <SelectItem key={currency.id} value={currency.currency?.id || ''}>
                              {currency.currency?.name || 'Sin nombre'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billetera *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar billetera..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.wallets?.name || 'Sin nombre'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fila 4: Monto | Cotización */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cotización (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001"
                          min="0"
                          placeholder="Ej: 1.0000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fila 5: Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del movimiento (opcional)"
                        value={field.value || ''}
                        onChange={field.onChange}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
      icon={DollarSign}
      leftActions={
        currentPanel === 'edit' && editingMovement ? (
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
      rightLabel={
        currentPanel === 'view' && editingMovement ? "Editar" :
        editingMovement ? "Actualizar" : "Guardar"
      }
      onRightClick={() => {
        if (currentPanel === 'view' && editingMovement) {
          setPanel('edit');
        } else {
          form.handleSubmit(onSubmit)();
        }
      }}
      showLoadingSpinner={createMovementMutation.isPending || updateMovementMutation.isPending}
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

export default MovementFormModal;