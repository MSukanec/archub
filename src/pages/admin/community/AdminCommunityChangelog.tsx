import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, FileText } from 'lucide-react'
import { formatDateCompact } from '@/lib/date-utils'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminChangelogRow from '@/components/ui/data-row/rows/AdminChangelogRow'

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

const AdminCommunityChangelog = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  // Fetch changelog entries (usando la misma lógica que AdminChangelogs.tsx)
  const { data: changelogEntries = [], isLoading } = useQuery({
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
  })

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

  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '25%',
      render: (entry: ChangelogEntry) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{entry.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">{entry.description}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '15%',
      render: (entry: ChangelogEntry) => (
        <Badge variant={getTypeBadgeVariant(entry.type)} className="text-xs">
          {entry.type}
        </Badge>
      )
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '15%',
      render: (entry: ChangelogEntry) => (
        <span className="text-xs text-muted-foreground">
          {formatDateCompact(entry.date)}
        </span>
      )
    },
    {
      key: 'is_public',
      label: 'Público',
      width: '15%',
      render: (entry: ChangelogEntry) => (
        <Badge variant={entry.is_public ? 'default' : 'secondary'} className="text-xs">
          {entry.is_public ? 'Sí' : 'No'}
        </Badge>
      )
    },
    {
      key: 'creator',
      label: 'Creado por',
      width: '15%',
      render: (entry: ChangelogEntry) => (
        <span className="text-xs text-muted-foreground">
          {entry.creator?.full_name || 'Desconocido'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Changelog Entries Table */}
      <Table
        data={changelogEntries}
        columns={columns}
        isLoading={isLoading}
        rowActions={(entry) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(entry)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(entry),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(entry) => (
          <AdminChangelogRow
            entry={entry}
            onClick={() => handleEdit(entry)}
            density="normal"
          />
        )}
        cardSpacing="space-y-0"
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron changelogs</p>
            <p className="text-xs">No hay changelogs que coincidan con los filtros aplicados.</p>
          </div>
        }
      />
    </div>
  )
}

export default AdminCommunityChangelog