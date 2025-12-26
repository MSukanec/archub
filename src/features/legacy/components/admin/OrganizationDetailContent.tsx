import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Users, 
  CreditCard, 
  Shield,
  UserPlus,
  Loader2,
  DollarSign,
  Building,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField';
import { DrawerSection } from '@/components/drawer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrganizationMember {
  id: string;
  user_id: string;
  role_id: string;
  is_billable: boolean;
  is_over_limit: boolean;
  joined_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  role: {
    id: string;
    name: string;
  } | null;
}

interface OrganizationSubscription {
  id: string;
  status: string;
  billing_period: string;
  starts_at: string;
  expires_at: string;
  provider_subscription_id: string | null;
  payment_provider: string | null;
  coupon_id: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan_id: string;
  created_by: string;
  settings: {
    is_founder?: boolean;
    [key: string]: any;
  } | null;
  plan: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  members_count: number;
  projects_count: number;
  last_seen_at: string | null;
}

export interface OrganizationDetailContentProps {
  organization: Organization;
  onSuccess?: () => void;
  onCancel?: () => void;
  hideActions?: boolean;
}

function useOrganizationMembers(organizationId: string) {
  return useQuery({
    queryKey: ['admin-organization-members', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role_id,
          is_billable,
          is_over_limit,
          joined_at
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      const userIds = data.map(m => m.user_id).filter(Boolean);
      const roleIds = data.map(m => m.role_id).filter(Boolean);
      
      const [usersResult, rolesResult] = await Promise.all([
        userIds.length > 0 ? supabase!
          .from('users')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds) : { data: [], error: null },
        roleIds.length > 0 ? supabase!
          .from('roles')
          .select('id, name')
          .in('id', roleIds) : { data: [], error: null }
      ]);
      
      return data.map(member => ({
        ...member,
        user: usersResult.data?.find(u => u.id === member.user_id) || null,
        role: rolesResult.data?.find(r => r.id === member.role_id) || null
      })) as OrganizationMember[];
    },
    enabled: !!organizationId
  });
}

function useOrganizationSubscription(organizationId: string) {
  return useQuery({
    queryKey: ['admin-organization-subscription', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(`
          id,
          status,
          billing_period,
          starts_at,
          expires_at,
          provider_subscription_id,
          payment_provider,
          coupon_id,
          plan_id
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const { data: plan } = await supabase!
        .from('plans')
        .select('id, name, slug')
        .eq('id', data.plan_id)
        .single();
      
      return {
        ...data,
        plan
      } as OrganizationSubscription;
    },
    enabled: !!organizationId
  });
}

function useOrganizationRoles() {
  return useQuery({
    queryKey: ['organization-roles'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, type')
        .eq('type', 'organization')
        .order('name');
      if (error) throw error;
      return data;
    }
  });
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
}

function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });
}

export function OrganizationDetailContent({
  organization,
  onSuccess,
  hideActions = false,
}: OrganizationDetailContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRoleId, setNewMemberRoleId] = useState('');
  const [newMemberIsBillable, setNewMemberIsBillable] = useState(false);
  
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organization.id);
  const { data: subscription, isLoading: subscriptionLoading } = useOrganizationSubscription(organization.id);
  const { data: roles } = useOrganizationRoles();
  const { data: allUsers, isLoading: usersLoading } = useAdminUsers();
  
  const existingMemberIds = useMemo(() => 
    new Set(members?.map(m => m.user_id) || []), 
    [members]
  );
  
  const userOptions = useMemo(() => {
    if (!allUsers) return [];
    return allUsers
      .filter(user => !existingMemberIds.has(user.id))
      .map(user => ({
        value: user.id,
        label: `${user.full_name || user.email} (${user.email})`
      }));
  }, [allUsers, existingMemberIds]);
  
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, is_billable }: { memberId: string; is_billable: boolean }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organization_members')
        .update({ is_billable })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organization-members', organization.id] });
      toast({ title: 'Miembro actualizado' });
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  });
  
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      if (!newMemberUserId) {
        throw new Error('Selecciona un usuario');
      }
      
      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: newMemberUserId,
          role_id: newMemberRoleId,
          is_billable: newMemberIsBillable,
          joined_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organization-members', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({ title: 'Miembro agregado correctamente' });
      setShowAddMember(false);
      setNewMemberUserId('');
      setNewMemberRoleId('');
      setNewMemberIsBillable(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
  
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organization-members', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({ title: 'Miembro eliminado' });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error deleting member:', error);
      toast({ title: 'Error al eliminar miembro', variant: 'destructive' });
    }
  });

  const handleToggleBillable = (member: OrganizationMember) => {
    updateMemberMutation.mutate({
      memberId: member.id,
      is_billable: !member.is_billable
    });
  };
  
  const handleDeleteMember = (member: OrganizationMember) => {
    if (confirm(`¿Eliminar a ${member.user?.full_name || member.user?.email || 'este miembro'} de la organización?`)) {
      deleteMemberMutation.mutate(member.id);
    }
  };
  
  const handleAddMember = () => {
    if (!newMemberUserId || !newMemberRoleId) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' });
      return;
    }
    addMemberMutation.mutate();
  };
  
  const planName = organization.plan?.name || 'Sin plan';
  const getPlanBgColor = (name: string) => {
    if (name === 'Free') return 'bg-[var(--plan-free-bg)]';
    if (name === 'Pro') return 'bg-[var(--plan-pro-bg)]';
    if (name === 'Teams') return 'bg-[var(--plan-teams-bg)]';
    return 'bg-muted';
  };
  
  return (
    <div className="w-full">
      <DrawerSection title="Información General" icon={Building}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Nombre</p>
            <p className="text-sm font-medium">{organization.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={organization.is_active ? 'default' : 'secondary'}>
              {organization.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Creador</p>
            <p className="text-sm">{organization.creator?.full_name || 'Desconocido'}</p>
            <p className="text-xs text-muted-foreground">{organization.creator?.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha de Creación</p>
            <p className="text-sm">
              {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
          {organization.settings?.is_founder && (
            <div className="col-span-2">
              <Badge className="bg-amber-500 text-white">
                Organización Fundadora
              </Badge>
            </div>
          )}
        </div>
      </DrawerSection>
      
      <DrawerSection title="Plan y Suscripción" icon={CreditCard}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={cn(getPlanBgColor(planName), 'text-white')}>
              {planName}
            </Badge>
            {subscription && (
              <span className="text-xs text-muted-foreground">
                {subscription.billing_period === 'annual' ? 'Anual' : 'Mensual'}
              </span>
            )}
          </div>
          
          {subscriptionLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando suscripción...
            </div>
          ) : subscription ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant="outline">{subscription.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expira</p>
                <p>{format(new Date(subscription.expires_at), 'dd/MM/yyyy', { locale: es })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gateway</p>
                <p>{subscription.payment_provider || 'Ninguno (cupón 100%)'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID Suscripción</p>
                <p className="text-xs font-mono truncate" title={subscription.provider_subscription_id || undefined}>
                  {subscription.provider_subscription_id || 'N/A (gifted)'}
                </p>
              </div>
              {subscription.coupon_id && (
                <div className="col-span-2">
                  <Badge variant="secondary">Usado con cupón</Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin suscripción activa</p>
          )}
        </div>
      </DrawerSection>
      
      <DrawerSection 
        title="Miembros" 
        icon={Users}
        badge={
          <Badge variant="secondary" className="ml-auto">
            {members?.length || 0}
          </Badge>
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddMember(!showAddMember)}
            className="h-7 px-2"
            data-testid="add-member-button"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-3">
          {showAddMember && (
            <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
              <p className="text-sm font-medium">Agregar Miembro</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Usuario</Label>
                  <ComboBox
                    value={newMemberUserId}
                    onValueChange={setNewMemberUserId}
                    options={userOptions}
                    placeholder={usersLoading ? "Cargando usuarios..." : "Seleccionar usuario"}
                    searchPlaceholder="Buscar por nombre o email..."
                    emptyMessage="No se encontraron usuarios disponibles"
                    disabled={usersLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs">Rol</Label>
                  <Select value={newMemberRoleId} onValueChange={setNewMemberRoleId}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newMemberIsBillable}
                    onCheckedChange={setNewMemberIsBillable}
                    data-testid="new-member-billable"
                  />
                  <Label className="text-xs">
                    Facturable (cobra seat)
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberUserId('');
                    setNewMemberRoleId('');
                    setNewMemberIsBillable(false);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={addMemberMutation.isPending || !newMemberUserId || !newMemberRoleId}
                  className="flex-1"
                  data-testid="confirm-add-member"
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Agregar'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {membersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando miembros...
            </div>
          ) : members?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay miembros
            </p>
          ) : (
            <div className="space-y-2">
              {members?.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border border-border',
                    member.is_over_limit && 'border-destructive/50 bg-destructive/5'
                  )}
                  data-testid={`member-row-${member.id}`}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {member.user?.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {member.user?.full_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role?.name || 'Sin rol'}
                    </Badge>
                    
                    <div className="flex items-center gap-1" title={member.is_billable ? 'Facturable' : 'No facturable'}>
                      <DollarSign className={cn(
                        'h-3 w-3',
                        member.is_billable ? 'text-green-500' : 'text-muted-foreground'
                      )} />
                      <Switch
                        checked={member.is_billable}
                        onCheckedChange={() => handleToggleBillable(member)}
                        disabled={updateMemberMutation.isPending}
                        data-testid={`toggle-billable-${member.id}`}
                      />
                    </div>
                    
                    {member.is_over_limit && (
                      <Badge variant="destructive" className="text-xs">
                        Bloqueado
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMember(member)}
                      disabled={deleteMemberMutation.isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      data-testid={`delete-member-${member.id}`}
                    >
                      {deleteMemberMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerSection>
    </div>
  );
}

export default OrganizationDetailContent;
