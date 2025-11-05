import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
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

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
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
      key: 'title',
      label: 'Título',
      width: '25%',
      render: (announcement: AnnouncementWithCreator) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{announcement.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">{announcement.message}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '12%',
      render: (announcement: AnnouncementWithCreator) => (
        <Badge variant={getTypeBadgeVariant(announcement.type)} className="gap-1.5">
          {getTypeIcon(announcement.type)}
          {announcement.type}
        </Badge>
      )
    },
    {
      key: 'audience',
      label: 'Audiencia',
      width: '10%',
      render: (announcement: AnnouncementWithCreator) => (
        <Badge variant="outline">
          {getAudienceLabel(announcement.audience)}
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'Estado',
      width: '10%',
      render: (announcement: AnnouncementWithCreator) => (
        <Badge variant={announcement.is_active ? 'secondary' : 'outline'}>
          {announcement.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'dates',
      label: 'Fechas',
      width: '15%',
      render: (announcement: AnnouncementWithCreator) => (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>Inicio: {announcement.starts_at ? formatDateCompact(announcement.starts_at) : '-'}</span>
          <span>Fin: {announcement.ends_at ? formatDateCompact(announcement.ends_at) : 'Sin límite'}</span>
        </div>
      )
    },
    {
      key: 'creator',
      label: 'Creador',
      width: '18%',
      render: (announcement: AnnouncementWithCreator) => {
        const creator = announcement.creator;
        return creator ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{creator.full_name || 'Sin nombre'}</span>
            <span className="text-xs text-muted-foreground">{creator.email}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Desconocido</span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Table
        data={announcements}
        columns={columns}
        isLoading={isLoading}
        rowActions={(announcement: AnnouncementWithCreator) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(announcement)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(announcement),
            variant: 'destructive' as const
          }
        ]}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron anuncios</p>
            <p className="text-xs">No hay anuncios globales creados.</p>
          </div>
        }
      />
    </div>
  );
};

export default AdminCommunityAnnouncementsTab;
