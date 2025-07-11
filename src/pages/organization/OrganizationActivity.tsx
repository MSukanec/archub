import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Folder, DollarSign, Users, FileText, Building, Eye } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CustomTable } from '@/components/ui-custom/misc/CustomTable';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import ActivityCard from '@/components/cards/ActivityCard';

import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';

export default function OrganizationActivity() {
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState('date_recent');
  const [filterByType, setFilterByType] = useState('all');
  const currentOrganization = userData?.organization;

  // Fetch all organization activity
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['organization-activity', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const allActivities = [];
      console.log('Fetching activities for organization:', currentOrganization.id);

      // Get projects with user information - simplified approach
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      console.log('Projects data:', projects);
      console.log('Projects error:', projectsError);

      // Get users for project creators
      let projectsWithUsers = [];
      if (projects?.length) {
        const creatorIds = [...new Set(projects.map(p => p.created_by).filter(Boolean))];
        console.log('Creator IDs:', creatorIds);
        
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        
        console.log('Users data:', users);
        
        projectsWithUsers = projects.map(project => ({
          ...project,
          user: users?.find(u => u.id === project.created_by) || { full_name: 'Usuario', avatar_url: null }
        }));
      }

      projectsWithUsers?.forEach(project => {
        allActivities.push({
          id: `project-${project.id}`,
          type: 'project',
          type_label: 'Nuevo Proyecto',
          title: 'Nuevo proyecto creado',
          description: `Se creó el proyecto "${project.name}"`,
          created_at: project.created_at,
          author: project.user,
          status: project.status
        });
      });

      // Get movements
      const { data: movements, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      console.log('Movements data:', movements);
      console.log('Movements error:', movementsError);

      // Get users for movement creators
      let movementsWithUsers = [];
      if (movements?.length) {
        const creatorIds = [...new Set(movements.map(m => m.created_by).filter(Boolean))];
        
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        
        movementsWithUsers = movements.map(movement => ({
          ...movement,
          user: users?.find(u => u.id === movement.created_by) || { full_name: 'Usuario', avatar_url: null }
        }));
      }

      movementsWithUsers?.forEach(movement => {
        allActivities.push({
          id: `movement-${movement.id}`,
          type: 'movement',
          type_label: movement.amount && movement.amount > 0 ? 'Nuevo Ingreso' : 'Nuevo Egreso',
          title: 'Movimiento financiero registrado',
          description: `${movement.description || 'Movimiento'}: $${movement.amount?.toLocaleString()}`,
          created_at: movement.created_at,
          author: movement.user,
          amount: movement.amount
        });
      });

      // Get contacts - note: contacts table doesn't have created_by field based on schema
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      console.log('Contacts data:', contacts);
      console.log('Contacts error:', contactsError);

      contacts?.forEach(contact => {
        allActivities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          type_label: 'Nuevo Contacto',
          title: 'Nuevo contacto agregado',
          description: `Se agregó a ${contact.first_name} ${contact.last_name}${contact.company_name ? ` de ${contact.company_name}` : ''}`,
          created_at: contact.created_at,
          author: { full_name: 'Sistema', avatar_url: null } // Contacts don't have created_by field
        });
      });

      // Get site logs with user information
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select(`
          id, 
          entry_type, 
          weather, 
          comments, 
          created_at,
          created_by,
          users!site_logs_created_by_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      siteLogs?.forEach(log => {
        allActivities.push({
          id: `site_log-${log.id}`,
          type: 'site_log',
          type_label: 'Nueva Bitácora',
          title: 'Nueva entrada de bitácora',
          description: `Entrada ${log.entry_type} - ${log.weather}`,
          created_at: log.created_at,
          author: log.users || { full_name: 'Usuario', avatar_url: null }
        });
      });

      // Sort all activities by date
      return allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!currentOrganization?.id
  });

  // Filtrar y ordenar actividades
  let filteredActivities = activities?.filter(activity => {
    const matchesSearch = (activity.description || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                         (activity.type_label || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                         (activity.author?.full_name || '').toLowerCase().includes(searchValue.toLowerCase());
    
    if (filterByType === "all") return matchesSearch;
    return matchesSearch && activity.type === filterByType;
  }) || [];

  // Aplicar ordenamiento
  filteredActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date_oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'type_asc':
        return a.type_label.localeCompare(b.type_label);
      case 'type_desc':
        return b.type_label.localeCompare(a.type_label);
      case 'author_asc':
        return (a.author.full_name || '').localeCompare(b.author.full_name || '');
      case 'author_desc':
        return (b.author.full_name || '').localeCompare(a.author.full_name || '');
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchValue("");
    setSortBy('date_recent');
    setFilterByType('all');
  };

  const handleActivityClick = (activity: any) => {
    console.log('Detalles de actividad:', activity);
    
    // Usar las rutas exactas del App.tsx
    switch (activity.type) {
      case 'project':
        navigate('/proyectos');
        break;
      case 'movement':
        navigate('/movimientos');
        break;
      case 'contact':
        navigate('/organization/contactos');
        break;
      case 'site_log':
        navigate('/bitacora');
        break;
      default:
        alert(`Ver detalles de: ${activity.type_label}\n${activity.description}`);
        break;
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Filtros personalizados
  const customFilters = (
    <div className="w-64 p-3 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[var(--menues-fg)] opacity-70">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_recent">Fecha (Más reciente)</SelectItem>
            <SelectItem value="date_oldest">Fecha (Más antigua)</SelectItem>
            <SelectItem value="type_asc">Tipo (A-Z)</SelectItem>
            <SelectItem value="type_desc">Tipo (Z-A)</SelectItem>
            <SelectItem value="author_asc">Autor (A-Z)</SelectItem>
            <SelectItem value="author_desc">Autor (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[var(--menues-fg)] opacity-70">Filtrar por tipo</Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="project">Proyectos</SelectItem>
            <SelectItem value="movement">Movimientos</SelectItem>
            <SelectItem value="contact">Contactos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const headerProps = {
    icon: Activity,
    title: "Actividad",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions: []
  };

  if (!currentOrganization) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No hay organización seleccionada.</p>
          <p className="text-xs">Selecciona una organización para ver la actividad.</p>
        </div>
      </Layout>
    );
  }

  // Configuración de columnas para la tabla con anchos personalizados
  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '10%',
      render: (activity: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {activity.created_at ? format(new Date(activity.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">
            {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { 
              addSuffix: true, 
              locale: es 
            }) : 'N/A'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'date' as const
    },
    {
      key: 'author',
      label: 'Autor',
      width: '10%',
      render: (activity: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activity.author?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(activity.author?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {activity.author?.full_name || 'Usuario'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'type_label',
      label: 'Tipo',
      width: '10%',
      render: (activity: any) => (
        <Badge variant="outline" className="text-xs">
          {activity.type_label}
        </Badge>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'description',
      label: 'Descripción',
      // Sin width definido - ocupará el resto del espacio automáticamente
      render: (activity: any) => (
        <span className="text-sm text-muted-foreground">
          {activity.description}
        </span>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (activity: any) => (
        <Button 
          size="sm" 
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleActivityClick(activity);
          }}
          className="h-8 px-2 text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver detalles
        </Button>
      ),
      sortable: false
    }
  ];

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* FeatureIntroduction */}
        <FeatureIntroduction
          title="Actividad de la Organización"
          icon={<Activity className="w-6 h-6" />}
          features={[
            {
              icon: <Activity className="w-4 h-4" />,
              title: "Seguimiento organizacional completo",
              description: "Esta página te permite dar seguimiento a todo lo que sucede en tu organización y sus proyectos, manteniendo un registro detallado de todas las actividades."
            },
            {
              icon: <Users className="w-4 h-4" />,
              title: "Trackeo de acciones por miembro",
              description: "Puedes ver quién de cada miembro del equipo hizo qué en cada momento, permitiendo un seguimiento preciso de las acciones y responsabilidades de cada persona."
            },
            {
              icon: <Folder className="w-4 h-4" />,
              title: "Monitoreo de proyectos",
              description: "Supervisa la creación y progreso de todos los proyectos con información detallada de fechas y responsables."
            },
            {
              icon: <DollarSign className="w-4 h-4" />,
              title: "Historial financiero",
              description: "Rastrea todos los movimientos financieros con información de montos, fechas y quién realizó cada transacción."
            }
          ]}
        />

        <CustomTable
          columns={columns}
          data={filteredActivities}
          isLoading={isLoading}
          renderCard={(activity) => (
            <ActivityCard activity={activity} />
          )}
          emptyState={
            <CustomEmptyState
              icon={<Activity className="h-12 w-12" />}
              title="No hay actividad reciente"
              description="La actividad aparecerá aquí cuando se creen proyectos, movimientos o contactos en esta organización."
            />
          }
        />
      </div>
    </Layout>
  );
}