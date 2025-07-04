import { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Building, Crown, Filter } from 'lucide-react';
import { NewAdminOrganizationModal } from '@/modals/admin/NewAdminOrganizationModal';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan_id: string;
  created_by: string;
  plan: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  members_count: number;
  projects_count: number;
}

// Hook para obtener todas las organizaciones (admin)
function useAllOrganizations() {
  return useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          is_active,
          is_system,
          plan_id,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }

      // Obtener los planes y usuarios creadores
      const planIds = Array.from(new Set(data.map(org => org.plan_id).filter(Boolean)));
      const creatorIds = Array.from(new Set(data.map(org => org.created_by).filter(Boolean)));
      
      const [plansResult, usersResult] = await Promise.all([
        planIds.length > 0 ? supabase!
          .from('plans')
          .select('id, name')
          .in('id', planIds) : { data: [], error: null },
        creatorIds.length > 0 ? supabase!
          .from('users')
          .select('id, full_name, email')
          .in('id', creatorIds) : { data: [], error: null }
      ]);

      // Mapear organizaciones con sus relaciones
      const organizationsWithPlans = data.map(org => ({
        ...org,
        plan: plansResult.data?.find(plan => plan.id === org.plan_id) || null,
        creator: usersResult.data?.find(user => user.id === org.created_by) || null
      }));

      console.log('Organizations with plans:', organizationsWithPlans);

      // Obtener conteos de miembros y proyectos para cada organización
      const organizationsWithCounts = await Promise.all(
        organizationsWithPlans.map(async (org) => {
          const [membersResult, projectsResult] = await Promise.all([
            supabase!
              .from('organization_members')
              .select('id', { count: 'exact' })
              .eq('organization_id', org.id),
            supabase!
              .from('projects')
              .select('id', { count: 'exact' })
              .eq('organization_id', org.id)
          ]);

          return {
            ...org,
            members_count: membersResult.count || 0,
            projects_count: projectsResult.count || 0
          };
        })
      );

      return organizationsWithCounts;
    }
  });
}

export default function AdminOrganizations() {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);

  const { data: organizations, isLoading } = useAllOrganizations();

  // Calculate statistics
  const stats = {
    total: organizations?.length || 0,
    free: organizations?.filter(org => org.plan?.name === 'Free').length || 0,
    pro: organizations?.filter(org => org.plan?.name === 'Pro').length || 0,
    teams: organizations?.filter(org => org.plan?.name === 'Teams').length || 0
  };

  const handleEdit = (organizationId: string) => {
    const org = organizations?.find(o => o.id === organizationId);
    if (org) {
      setEditingOrganization(org);
      setShowModal(true);
    }
  };

  const handleDelete = (organizationId: string) => {
    console.log('Delete organization:', organizationId);
    // TODO: Implement delete functionality
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrganization(null);
  };

  // Filtrar organizaciones
  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && org.is_active) ||
      (statusFilter === 'inactive' && !org.is_active);
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'system' && org.is_system) ||
      (typeFilter === 'regular' && !org.is_system);
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleClearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const customFilters = (
    <div className="space-y-4 w-72">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select defaultValue="date-desc">
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
            <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Estado</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Tipo</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="regular">Regulares</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const headerProps = {
    title: "Gestión de Organizaciones",
    icon: Building,
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: handleClearFilters,
    actions: []
  };

  const columns = [
    {
      key: 'created_at' as keyof Organization,
      label: 'Fecha',
      width: '5%',
      render: (org: Organization) => (
        <div className="text-sm">
          {format(new Date(org.created_at), 'dd MMM yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'name' as keyof Organization,
      label: 'Organización',
      width: '35%',
      render: (org: Organization) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center">
            <Building className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <div className="font-medium text-sm">{org.name}</div>
            {org.is_system && (
              <Badge variant="secondary" className="text-xs">Sistema</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'creator' as keyof Organization,
      label: 'Creador',
      width: '30%',
      render: (org: Organization) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center text-xs">
            {org.creator?.full_name?.charAt(0) || org.creator?.email?.charAt(0) || '?'}
          </div>
          <div className="text-sm">
            {org.creator?.full_name || org.creator?.email || 'Sin asignar'}
          </div>
        </div>
      )
    },
    {
      key: 'plan' as keyof Organization,
      label: 'Plan',
      width: '5%',
      render: (org: Organization) => (
        <Badge variant="outline" className="text-xs">
          {org.plan?.name || 'Sin plan'}
        </Badge>
      )
    },
    {
      key: 'members_count' as keyof Organization,
      label: 'Miembros',
      width: '5%',
      render: (org: Organization) => (
        <div className="text-sm">{org.members_count || 0}</div>
      )
    },
    {
      key: 'projects_count' as keyof Organization,
      label: 'Proyectos',
      width: '5%',
      render: (org: Organization) => (
        <div className="text-sm">{org.projects_count || 0}</div>
      )
    },
    {
      key: 'is_active' as keyof Organization,
      label: 'Estado',
      width: '5%',
      render: (org: Organization) => (
        <Badge variant={org.is_active ? 'default' : 'secondary'} className="text-xs">
          {org.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'id' as keyof Organization,
      label: 'Acciones',
      width: '5%',
      render: (org: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(org.id)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(org.id)}
              className="text-red-600"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Organizaciones</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
              <Building className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Plan Free</p>
                <p className="text-lg font-semibold">{stats.free}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Plan Pro</p>
                <p className="text-lg font-semibold">{stats.pro}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Plan Teams</p>
                <p className="text-lg font-semibold">{stats.teams}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        <CustomTable
          data={filteredOrganizations}
          columns={columns}
          isLoading={isLoading}
          emptyState={<div className="text-center py-8 text-muted-foreground">No se encontraron organizaciones</div>}
          className="min-h-[400px]"
        />

        {showModal && (
          <NewAdminOrganizationModal
            open={showModal}
            onClose={handleCloseModal}
            organization={editingOrganization}
          />
        )}
      </div>
    </Layout>
  );
}