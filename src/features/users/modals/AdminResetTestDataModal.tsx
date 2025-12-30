import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  plan_id: string | null;
  plan?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface ResetTestDataModalProps {
  modalData?: any;
  onClose: () => void;
}

export default function ResetTestDataModal({ onClose }: ResetTestDataModalProps) {
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['admin-organizations-reset'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, plan_id')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw error;

      const planIds = Array.from(new Set((data || []).map(org => org.plan_id).filter(Boolean)));
      
      let plans: any[] = [];
      if (planIds.length > 0) {
        const { data: plansData } = await supabase
          .from('plans')
          .select('id, name, slug')
          .in('id', planIds);
        plans = plansData || [];
      }

      return (data || []).map(org => ({
        ...org,
        plan: plans.find(p => p.id === org.plan_id) || null
      }));
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['admin-users-reset'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    setResetSuccess(false);
  }, [selectedOrgId, selectedUserId]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('[ResetModal] Calling reset_test_payments_and_subscriptions with:', {
        p_user_id: selectedUserId,
        p_organization_id: selectedOrgId
      });

      const { error } = await supabase.rpc('reset_test_payments_and_subscriptions', {
        p_user_id: selectedUserId,
        p_organization_id: selectedOrgId
      });

      if (error) {
        console.error('[ResetModal] RPC error:', error);
        throw new Error(error.message || 'Error al resetear datos');
      }

      return { success: true };
    },
    onSuccess: () => {
      setResetSuccess(true);
      
      toast({
        title: 'Datos reseteados exitosamente',
        description: 'Se han eliminado pagos, suscripciones, enrollments y errores del sistema.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-reset'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron resetear los datos',
        variant: 'destructive',
      });
    },
  });

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);
  const selectedUser = users.find(user => user.id === selectedUserId);
  const isFreePlan = selectedOrg?.plan?.slug === 'free';
  const canSubmit = selectedOrgId && selectedUserId;

  const handleReset = () => {
    if (!selectedOrgId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una organización',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un usuario',
        variant: 'destructive',
      });
      return;
    }
    resetMutation.mutate();
  };

  const orgOptions = organizations.map(org => ({
    value: org.id,
    label: `${org.name}${org.plan?.name ? ` (${org.plan.name})` : ''}`
  }));

  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.full_name || 'Sin nombre'} - ${user.email}`
  }));

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title="Resetear Test Data"
        description="Elimina datos de prueba: pagos, suscripciones, enrollments y errores del sistema"
        icon={RotateCcw}
      />

      <ModalBody>
        <div className="space-y-4">
          {resetSuccess ? (
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong className="text-green-600 dark:text-green-400">Operación completada exitosamente</strong>
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm mb-3">Se ejecutó la función:</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  reset_test_payments_and_subscriptions('{selectedUserId}', '{selectedOrgId}')
                </code>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p><strong>Usuario:</strong> {selectedUser?.full_name || selectedUser?.email}</p>
                  <p><strong>Organización:</strong> {selectedOrg?.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Organización *</Label>
                <ComboBox
                  value={selectedOrgId}
                  onValueChange={setSelectedOrgId}
                  options={orgOptions}
                  placeholder={orgsLoading ? "Cargando..." : "Buscar organización..."}
                  searchPlaceholder="Buscar por nombre..."
                  emptyMessage="No se encontraron organizaciones"
                  disabled={orgsLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Usuario *</Label>
                <ComboBox
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  options={userOptions}
                  placeholder={usersLoading ? "Cargando..." : "Buscar usuario..."}
                  searchPlaceholder="Buscar por nombre o email..."
                  emptyMessage="No se encontraron usuarios"
                  disabled={usersLoading}
                />
              </div>

              {selectedOrgId && !isFreePlan && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta organización tiene el plan <strong>{selectedOrg?.plan?.name}</strong>. 
                    Al resetear, se cambiará al plan Free.
                  </AlertDescription>
                </Alert>
              )}

              {canSubmit && (
                <Alert>
                  <AlertDescription>
                    <strong>Se ejecutará la función:</strong>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Eliminar enrollments de cursos del usuario</li>
                      <li>Eliminar pagos del usuario y organización</li>
                      <li>Eliminar suscripciones de la organización</li>
                      <li>Resetear plan de la organización a Free</li>
                      <li>Limpiar errores del sistema asociados</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </ModalBody>

      <ModalFooter
        leftLabel={resetSuccess ? "Cerrar" : "Cancelar"}
        onLeftClick={onClose}
        submitText={resetSuccess ? undefined : "Resetear Datos"}
        onSubmit={resetSuccess ? undefined : handleReset}
        isSubmitting={resetMutation.isPending}
        submitVariant="destructive"
        submitDisabled={!canSubmit}
      />
    </ModalLayout>
  );
}
