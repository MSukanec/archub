import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="organization">Organización</Label>
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger id="organization" data-testid="select-organization">
            <SelectValue placeholder="Seleccionar organización..." />
          </SelectTrigger>
          <SelectContent>
            {orgsLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : (
              organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <span>{org.name}</span>
                    {org.plans && (
                      <span className="text-xs text-muted-foreground">
                        ({org.plans.name})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedOrgId && (
        <div className="space-y-2">
          <Label htmlFor="user">Usuario (opcional - para borrar progreso de cursos)</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user" data-testid="select-user">
              <SelectValue placeholder="Seleccionar usuario..." />
            </SelectTrigger>
            <SelectContent>
              {membersLoading ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : members.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No hay miembros
                </div>
              ) : (
                members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex flex-col">
                      <span>{member.users?.full_name || 'Sin nombre'}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.users?.email}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedOrgId && isFreePlan && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Esta organización ya está en el plan Free.
          </AlertDescription>
        </Alert>
      )}

      {selectedOrgId && !isFreePlan && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Advertencia:</strong> Esta acción eliminará todos los pagos, suscripciones 
            y reseteará la organización al plan Free. Esta acción no se puede deshacer.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel">
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={() => resetMutation.mutate()}
          disabled={!selectedOrgId || resetMutation.isPending}
          data-testid="button-reset-data"
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reseteando...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Resetear Registros
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
