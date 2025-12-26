import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
interface OrganizationMember {
  id: string;
  user_id: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}
interface ResetResult {
  payments: number;
  payment_events: number;
  mp_subscription_preferences: number;
  organization_subscriptions: number;
  course_lesson_progress: number;
  organization_reset: number;
  projects_reset: number;
  members_reset: number;
}
interface ResetTestDataModalProps {
  modalData?: any;
  onClose: () => void;
}
export default function ResetTestDataModal({ onClose }: ResetTestDataModalProps) {
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
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
  const { data: members = [], isLoading: membersLoading } = useQuery<OrganizationMember[]>({
    queryKey: ['admin-org-members-reset', selectedOrgId],
    queryFn: async () => {
      if (!supabase || !selectedOrgId) return [];
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          users (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', selectedOrgId)
        .eq('is_active', true);
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      return (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        user: Array.isArray(m.users) ? m.users[0] : m.users
      }));
    },
    enabled: !!selectedOrgId,
  });
  useEffect(() => {
    setSelectedUserId('');
    setResetResult(null);
  }, [selectedOrgId]);
  const resetMutation = useMutation({
    mutationFn: async () => {
      console.log('[ResetModal] Starting reset mutation with orgId:', selectedOrgId);
      const payload: { organizationId: string; userId?: string } = {
        organizationId: selectedOrgId,
      };
      if (selectedUserId && selectedUserId !== 'none'&& selectedUserId.trim() !== '') {
        payload.userId = selectedUserId;
      }
      console.log('[ResetModal] Sending request with payload:', payload);
      const response = await apiRequest('POST', '/api/admin/reset-test-data', payload);
      console.log('[ResetModal] Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ResetModal] Error response:', errorData);
        throw new Error(errorData.error || 'Error al resetear datos');
      }
      const result = await response.json();
      console.log('[ResetModal] Success response:', result);
      return result;
    },
    onSuccess: (data) => {
      const records = data?.deletedRecords || {};
      setResetResult(records);
      
      toast({
        title: 'Datos reseteados exitosamente',
        description: 'Revisa el resumen de cambios en el modal.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-reset'] });
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
  const isFreePlan = selectedOrg?.plan?.slug === 'free';
  const handleReset = () => {
    if (!selectedOrgId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una organización',
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
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title="Resetear Test Data"
        description="Elimina datos de prueba de suscripciones, pagos y progreso de cursos"
        icon={RotateCcw}
      />
      <ModalBody>
        <div className="space-y-4">
          {resetResult ? (
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong className="text-green-600 dark:text-green-400">Operación completada exitosamente</strong>
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm mb-3">Resumen de cambios:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Pagos eliminados</span>
                    <span className="font-mono font-medium">{resetResult.payments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Eventos de pago eliminados</span>
                    <span className="font-mono font-medium">{resetResult.payment_events || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Preferencias MercadoPago eliminadas</span>
                    <span className="font-mono font-medium">{resetResult.mp_subscription_preferences || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Suscripciones eliminadas</span>
                    <span className="font-mono font-medium">{resetResult.organization_subscriptions || 0}</span>
                  </div>
                  {resetResult.course_lesson_progress > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Progreso de cursos eliminado</span>
                      <span className="font-mono font-medium">{resetResult.course_lesson_progress}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Plan reseteado a Free</span>
                    <span className="font-mono font-medium">{resetResult.organization_reset ? 'Sí': 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Proyectos desbloqueados</span>
                    <span className="font-mono font-medium">{resetResult.projects_reset || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Miembros desbloqueados</span>
                    <span className="font-mono font-medium">{resetResult.members_reset || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Organización</Label>
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
              {selectedOrgId && (
                <div className="space-y-2">
                  <Label>Usuario (opcional - para borrar progreso de cursos)</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={membersLoading}
                  >
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder={membersLoading ? "Cargando..." : "Selecciona un usuario (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.user_id}>
                          {member.user?.full_name || 'Sin nombre'} - {member.user?.email || 'Sin email'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedOrgId && !isFreePlan && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta organización tiene el plan <strong>{selectedOrg?.plan?.name}</strong>. 
                    Al resetear, se cambiará al plan Free.
                  </AlertDescription>
                </Alert>
              )}
              {selectedOrgId && (
                <Alert>
                  <AlertDescription>
                    <strong>Se eliminarán:</strong>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Todos los pagos de la organización</li>
                      <li>Eventos de pago asociados</li>
                      <li>Preferencias de suscripción MercadoPago</li>
                      <li>Suscripciones activas</li>
                      {selectedUserId && selectedUserId !== 'none'&& <li>Progreso de cursos del usuario</li>}
                      <li>Se reseteará el plan a Free</li>
                      <li>Se desbloquearán proyectos y miembros</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter
        leftLabel={resetResult ? "Cerrar" : "Cancelar"}
        onLeftClick={onClose}
        submitText={resetResult ? undefined : "Resetear Datos"}
        onSubmit={resetResult ? undefined : handleReset}
        isSubmitting={resetMutation.isPending}
        submitVariant="destructive"
        submitDisabled={!selectedOrgId}
      />
    </ModalLayout>
  );
}
