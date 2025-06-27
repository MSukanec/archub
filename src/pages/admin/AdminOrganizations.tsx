import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Building, Crown, Filter } from 'lucide-react';
import { NewAdminOrganizationModal } from '@/modals/NewAdminOrganizationModal';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan: {
    id: string;
    name: string;
    max_projects: number;
    max_members: number;
  };
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
          plan:plans(
            id,
            name,
            max_projects,
            max_members
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener conteos de miembros y proyectos para cada organización
      const organizationsWithCounts = await Promise.all(
        data.map(async (org) => {
          const [membersResult, projectsResult] = await Promise.all([
            supabase
              .from('organization_members')
              .select('id', { count: 'exact' })
              .eq('organization_id', org.id),
            supabase
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

  const { data: organizations, isLoading } = useAllOrganizations();

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
      render: (org: Organization) => (
        <div className="text-sm">
          {format(new Date(org.created_at), 'dd MMM yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'name' as keyof Organization,
      label: 'Organización',
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
      key: 'plan' as keyof Organization,
      label: 'Plan',
      render: (org: Organization) => (
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-[var(--accent)]" />
          <div>
            <div className="font-medium text-sm">{org.plan?.name || 'Sin plan'}</div>
            <div className="text-xs text-muted-foreground">
              {org.plan?.max_projects} proyectos, {org.plan?.max_members} miembros
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'members_count' as keyof Organization,
      label: 'Miembros',
      render: (org: Organization) => (
        <div className="text-sm font-medium">{org.members_count}</div>
      )
    },
    {
      key: 'projects_count' as keyof Organization,
      label: 'Proyectos',
      render: (org: Organization) => (
        <div className="text-sm font-medium">{org.projects_count}</div>
      )
    },
    {
      key: 'is_active' as keyof Organization,
      label: 'Estado',
      render: (org: Organization) => (
        <Badge variant={org.is_active ? 'default' : 'secondary'}>
          {org.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'id' as keyof Organization,
      label: 'Acciones',
      render: (org: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('Ver detalles', org.id)}>
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Editar', org.id)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => console.log('Cambiar estado', org.id)}
              className="text-orange-600"
            >
              {org.is_active ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => console.log('Eliminar', org.id)}
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
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        <CustomTable
          data={filteredOrganizations}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No se encontraron organizaciones"
          className="min-h-[400px]"
        />
      </div>

      {showModal && (
        <NewAdminOrganizationModal
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </Layout>
  );
}