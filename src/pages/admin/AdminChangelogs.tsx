import { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, FileText, Calendar, Users, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

// Hook para obtener todas las entradas del changelog (admin)
function useAllChangelogEntries() {
  return useQuery({
    queryKey: ['admin-changelog-entries'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('changelog_entries')
        .select(`
          id,
          title,
          description,
          type,
          date,
          is_public,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching changelog entries:', error);
        throw error;
      }

      // Obtener los usuarios creadores
      const creatorIds = Array.from(new Set(data.map(entry => entry.created_by).filter(Boolean)));
      
      const usersResult = creatorIds.length > 0 ? await supabase!
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', creatorIds) : { data: [], error: null };

      // Mapear entradas con sus creadores
      const entriesWithCreators = data.map(entry => ({
        ...entry,
        creator: usersResult.data?.find(user => user.id === entry.created_by) || null
      }));

      return entriesWithCreators;
    }
  });
}

export default function AdminChangelogs() {
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const { openModal } = useGlobalModalStore();
  const queryClient = useQueryClient();

  const { data: changelogEntries = [], isLoading } = useAllChangelogEntries();

  // Filtrar datos según búsqueda y filtros
  const filteredData = changelogEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchValue.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const matchesVisibility = visibilityFilter === 'all' || 
      (visibilityFilter === 'public' && entry.is_public) ||
      (visibilityFilter === 'private' && !entry.is_public);
    
    return matchesSearch && matchesType && matchesVisibility;
  });

  // Estadísticas para las cards
  const totalEntries = changelogEntries.length;
  const publicEntries = changelogEntries.filter(entry => entry.is_public).length;
  const recentEntries = changelogEntries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate > weekAgo;
  }).length;
  const entriesByType = changelogEntries.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleEdit = (entry: ChangelogEntry) => {
    openModal('changelog-entry', { entry, isEditing: true });
  };

  const handleDelete = (entry: ChangelogEntry) => {
    openModal('delete-confirmation', {
      title: 'Eliminar entrada del changelog',
      description: '¿Estás seguro de que deseas eliminar esta entrada del changelog? Esta acción no se puede deshacer.',
      itemName: entry.title,
      destructiveActionText: 'Eliminar',
      onConfirm: async () => {
        if (!supabase) return;
        
        const { error } = await supabase
          .from('changelog_entries')
          .delete()
          .eq('id', entry.id);
        
        if (error) {
          console.error('Error deleting changelog entry:', error);
        } else {
          // Invalidar caché para actualizar la tabla
          queryClient.invalidateQueries({ queryKey: ['admin-changelog-entries'] });
        }
      }
    });
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Novedad':
        return 'default';
      case 'Mejora':
        return 'secondary';
      case 'Arreglo de Errores':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Novedad':
        return '🔹';
      case 'Mejora':
        return '🔧';
      case 'Arreglo de Errores':
        return '🐛';
      default:
        return '📄';
    }
  };

  const headerProps = {
    title: "Gestión de Changelog",
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '10%',
      render: (entry: ChangelogEntry) => (
        <span className="text-sm">
          {format(new Date(entry.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'change_date',
      label: 'Fecha del Cambio',
      width: '10%',
      render: (entry: ChangelogEntry) => (
        <span className="text-sm">
          {format(new Date(entry.date), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'title',
      label: 'Título',
      width: '25%'
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '15%',
      render: (entry: ChangelogEntry) => (
        <Badge variant={getTypeBadgeVariant(entry.type)}>
          {getTypeIcon(entry.type)} {entry.type}
        </Badge>
      )
    },
    {
      key: 'creator',
      label: 'Creador',
      width: '20%',
      render: (entry: ChangelogEntry) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            {entry.creator?.avatar_url ? (
              <img 
                src={entry.creator.avatar_url} 
                alt={entry.creator.full_name || entry.creator.email}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--accent-bg)] flex items-center justify-center text-xs font-medium text-[var(--accent)]">
                {entry.creator?.full_name?.charAt(0) || entry.creator?.email?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium truncate">
              {entry.creator?.full_name || 'Sin nombre'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {entry.creator?.email || 'Sin email'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'is_public',
      label: 'Visibilidad',
      width: '10%',
      render: (entry: ChangelogEntry) => (
        <Badge variant={entry.is_public ? 'default' : 'secondary'}>
          {entry.is_public ? 'Pública' : 'Privada'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (entry: ChangelogEntry) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(entry)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(entry)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout headerProps={headerProps} wide>
      {/* ActionBar */}
      <ActionBarDesktop
        title="Gestión de Changelog"
        icon={<FileText className="w-5 h-5" />}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        primaryActionLabel="Nueva Entrada"
        onPrimaryActionClick={() => openModal('changelog-entry', {})}
        showGrouping={false}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Entradas</p>
                <p className="text-lg font-semibold">{totalEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Entradas Públicas</p>
                <p className="text-lg font-semibold">{publicEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Recientes (7 días)</p>
                <p className="text-lg font-semibold">{recentEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Mejoras</p>
                <p className="text-lg font-semibold">{entriesByType['Mejora'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Table
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No se encontraron entradas del changelog"
        defaultSort={{ key: 'created_at', direction: 'desc' }}
      />

    </Layout>
  );
}