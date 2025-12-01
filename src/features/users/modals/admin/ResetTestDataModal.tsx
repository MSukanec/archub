import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  plan_id: string | null;
  plans?: {
    name: string;
    slug: string;
  } | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  users: User;
}

interface ResetTestDataModalProps {
  modalData?: any;
  onClose: () => void;
}

export default function ResetTestDataModal({ onClose }: ResetTestDataModalProps) {
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<OrganizationMember[]>({
    queryKey: ['/api/organization-members', selectedOrgId],
    enabled: !!selectedOrgId,
  });

  const members = membersData || [];

  useEffect(() => {
    setSelectedUserId('');
  }, [selectedOrgId]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const payload: { organizationId: string; userId?: string } = {
        organizationId: selectedOrgId,
      };
      if (selectedUserId && selectedUserId.trim() !== '') {
        payload.userId = selectedUserId;
      }
      const response = await apiRequest('POST', '/api/admin/reset-test-data', payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al resetear datos');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const records = data?.deletedRecords || {};
      const items: string[] = [];
      
      if (records.payments > 0) items.push(`${records.payments} pagos`);
      if (records.payment_events > 0) items.push(`${records.payment_events} eventos de pago`);
      if (records.mp_subscription_preferences > 0) items.push(`${records.mp_subscription_preferences} preferencias MP`);
      if (records.organization_subscriptions > 0) items.push(`${records.organization_subscriptions} suscripciones`);
      if (records.course_lesson_progress > 0) items.push(`${records.course_lesson_progress} progreso de cursos`);
      if (records.organization_reset > 0) items.push('Organización reseteada a Free');
      if (records.projects_reset > 0) items.push(`${records.projects_reset} proyectos desbloqueados`);
      if (records.members_reset > 0) items.push(`${records.members_reset} miembros desbloqueados`);

      toast({
        title: 'Datos reseteados',
        description: items.length > 0 
          ? `Se procesaron: ${items.join(', ')}`
          : 'Operación completada (no había datos para eliminar)',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      onClose();
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
  const isFreePlan = selectedOrg?.plans?.slug === 'free';

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

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title="Resetear Test Data"
        description="Elimina datos de prueba de suscripciones, pagos y progreso de cursos"
        icon={RotateCcw}
      />

      <ModalBody>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Organización</Label>
            <Select
              value={selectedOrgId}
              onValueChange={setSelectedOrgId}
              disabled={orgsLoading}
            >
              <SelectTrigger data-testid="select-organization">
                <SelectValue placeholder={orgsLoading ? "Cargando..." : "Selecciona una organización"} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} {org.plans?.name ? `(${org.plans.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <SelectItem value="">Ninguno</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.user_id}>
                      {member.users?.full_name || member.users?.email || 'Usuario sin nombre'}
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
                Esta organización tiene el plan <strong>{selectedOrg?.plans?.name}</strong>. 
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
                  {selectedUserId && <li>Progreso de cursos del usuario</li>}
                  <li>Se reseteará el plan a Free</li>
                  <li>Se desbloquearán proyectos y miembros</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText="Resetear Datos"
        onSubmit={handleReset}
        isSubmitting={resetMutation.isPending}
        submitVariant="destructive"
        submitDisabled={!selectedOrgId}
      />
    </ModalLayout>
  );
}
