import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Bell, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { formatDateCompact } from '@/lib/date-utils'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import type { GlobalAnnouncement } from '@shared/schema'

interface AnnouncementWithCreator extends GlobalAnnouncement {
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

const AdminCommunityAnnouncementsTab = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('global_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }

      const creatorIds = Array.from(new Set(data.map(a => a.created_by).filter(Boolean)));
      
      const usersResult = creatorIds.length > 0 ? await supabase!
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', creatorIds) : { data: [], error: null };

      const announcementsWithCreators: AnnouncementWithCreator[] = data.map(announcement => ({
        ...announcement,
        creator: usersResult.data?.find(user => user.id === announcement.created_by) || null,
      }));

      return announcementsWithCreators;
    }
  })

  const handleEdit = (announcement: AnnouncementWithCreator) => {
    openModal('announcement', { announcement, isEditing: true });
  };

  const handleDelete = (announcement: AnnouncementWithCreator) => {
    openModal('delete-confirmation', {
      title: 'Eliminar anuncio',
      description: '¿Estás seguro de que deseas eliminar este anuncio global?',
      itemName: announcement.title,
      destructiveActionText: 'Eliminar',
      onConfirm: async () => {
        if (!supabase) return;
        
        const { error } = await supabase
          .from('global_announcements')
          .delete()
          .eq('id', announcement.id);
        
        if (error) {
          console.error('Error deleting announcement:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar el anuncio.',
            variant: 'destructive'
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
          toast({
            title: 'Anuncio eliminado',
            description: 'El anuncio global ha sido eliminado exitosamente.'
          });
        }
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-3.5 w-3.5" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'error':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'success':
        return <CheckCircle className="h-3.5 w-3.5" />;
      default:
        return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'info':
        return 'default';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      case 'success':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getAudienceLabel = (audience: string | null) => {
    switch (audience) {
      case 'all':
        return 'Todos';
      case 'free':
        return 'Free';
      case 'pro':
        return 'Pro';
      case 'teams':
        return 'Teams';
      default:
        return 'Todos';
    }
  };

  const columns = [
    {
      header: 'Título',
      accessorKey: 'title',
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{row.original.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">{row.original.message}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      accessorKey: 'type',
      cell: ({ row }: any) => (
        <Badge variant={getTypeVariant(row.original.type)} className="gap-1.5">
          {getTypeIcon(row.original.type)}
          {row.original.type}
        </Badge>
      )
    },
    {
      header: 'Audiencia',
      accessorKey: 'audience',
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {getAudienceLabel(row.original.audience)}
        </Badge>
      )
    },
    {
      header: 'Estado',
      accessorKey: 'is_active',
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'secondary' : 'outline'}>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      header: 'Fechas',
      accessorKey: 'starts_at',
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>Inicio: {row.original.starts_at ? formatDateCompact(row.original.starts_at) : '-'}</span>
          <span>Fin: {row.original.ends_at ? formatDateCompact(row.original.ends_at) : 'Sin límite'}</span>
        </div>
      )
    },
    {
      header: 'Creador',
      accessorKey: 'creator',
      cell: ({ row }: any) => {
        const creator = row.original.creator;
        return creator ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{creator.full_name || 'Sin nombre'}</span>
            <span className="text-xs text-muted-foreground">{creator.email}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Desconocido</span>
        );
      }
    },
    {
      header: 'Acciones',
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            data-testid={`button-edit-announcement-${row.original.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            data-testid={`button-delete-announcement-${row.original.id}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando anuncios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="admin-announcements-tab">
      <Table
        data={announcements}
        columns={columns}
        searchPlaceholder="Buscar anuncios..."
        emptyMessage="No hay anuncios globales configurados."
      />
    </div>
  );
};

export default AdminCommunityAnnouncementsTab;
