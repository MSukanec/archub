import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ACTIVITY_ACTIONS } from '@/utils/logActivity';

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export function useOrganizationActivityLogs(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-activity-logs', organizationId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!organizationId) return [];


      const { data, error } = await supabase
        .from('organization_activity_logs')
        .select(`
          id,
          organization_id,
          user_id,
          action,
          target_table,
          target_id,
          metadata,
          created_at,
          users (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return [];
      }

      
      return data?.map(log => ({
        ...log,
        user: log.users
      })) || [];
    },
    enabled: !!organizationId
  });
}

export function getActivityDisplayInfo(log: ActivityLog) {
  const { action, target_table, metadata } = log;

  // Mapeo de acciones a información de display
  const actionInfo: Record<string, { icon: string; label: string; color: string }> = {
    [ACTIVITY_ACTIONS.CREATE_MOVEMENT]: { icon: '💰', label: 'Movimiento Creado', color: 'blue' },
    [ACTIVITY_ACTIONS.UPDATE_MOVEMENT]: { icon: '✏️', label: 'Movimiento Editado', color: 'yellow' },
    [ACTIVITY_ACTIONS.DELETE_MOVEMENT]: { icon: '🗑️', label: 'Movimiento Eliminado', color: 'red' },
    
    [ACTIVITY_ACTIONS.CREATE_SITE_LOG]: { icon: '📝', label: 'Bitácora Creada', color: 'green' },
    [ACTIVITY_ACTIONS.UPDATE_SITE_LOG]: { icon: '📝', label: 'Bitácora Editada', color: 'yellow' },
    [ACTIVITY_ACTIONS.DELETE_SITE_LOG]: { icon: '🗑️', label: 'Bitácora Eliminada', color: 'red' },
    
    [ACTIVITY_ACTIONS.UPLOAD_DESIGN_DOCUMENT]: { icon: '📄', label: 'Documento Subido', color: 'purple' },
    [ACTIVITY_ACTIONS.UPDATE_DESIGN_DOCUMENT]: { icon: '📄', label: 'Documento Editado', color: 'yellow' },
    [ACTIVITY_ACTIONS.DELETE_DESIGN_DOCUMENT]: { icon: '🗑️', label: 'Documento Eliminado', color: 'red' },
    
    [ACTIVITY_ACTIONS.CREATE_TASK]: { icon: '✅', label: 'Tarea Creada', color: 'blue' },
    [ACTIVITY_ACTIONS.UPDATE_TASK]: { icon: '✏️', label: 'Tarea Editada', color: 'yellow' },
    [ACTIVITY_ACTIONS.DELETE_TASK]: { icon: '🗑️', label: 'Tarea Eliminada', color: 'red' },
    [ACTIVITY_ACTIONS.COMPLETE_TASK]: { icon: '🎉', label: 'Tarea Completada', color: 'green' },
    
    [ACTIVITY_ACTIONS.ADD_CONTACT]: { icon: '👤', label: 'Contacto Agregado', color: 'blue' },
    [ACTIVITY_ACTIONS.UPDATE_CONTACT]: { icon: '✏️', label: 'Contacto Editado', color: 'yellow' },
    [ACTIVITY_ACTIONS.DELETE_CONTACT]: { icon: '🗑️', label: 'Contacto Eliminado', color: 'red' },
    
    [ACTIVITY_ACTIONS.ADD_MEMBER]: { icon: '👥', label: 'Miembro Agregado', color: 'green' },
    [ACTIVITY_ACTIONS.UPDATE_MEMBER]: { icon: '✏️', label: 'Miembro Editado', color: 'yellow' },
    [ACTIVITY_ACTIONS.REMOVE_MEMBER]: { icon: '🚪', label: 'Miembro Removido', color: 'red' },
    
    [ACTIVITY_ACTIONS.ADD_CLIENT]: { icon: '🤝', label: 'Cliente Agregado', color: 'green' },
    [ACTIVITY_ACTIONS.UPDATE_CLIENT]: { icon: '✏️', label: 'Cliente Editado', color: 'yellow' },
    [ACTIVITY_ACTIONS.REMOVE_CLIENT]: { icon: '🚪', label: 'Cliente Removido', color: 'red' }
  };

  const info = actionInfo[action] || { icon: '📊', label: 'Actividad', color: 'gray' };

  // Generar descripción basada en metadata
  let description = '';
  
  switch (action) {
    case ACTIVITY_ACTIONS.CREATE_MOVEMENT:
    case ACTIVITY_ACTIONS.UPDATE_MOVEMENT:
      description = `Movimiento de $${metadata.amount?.toLocaleString() || '0'}${metadata.description ? ` - ${metadata.description}` : ''}`;
      break;
      
    case ACTIVITY_ACTIONS.CREATE_SITE_LOG:
    case ACTIVITY_ACTIONS.UPDATE_SITE_LOG:
      description = `${metadata.entry_type || 'Entrada de bitácora'}${metadata.comments ? ` - ${metadata.comments}` : ''}`;
      break;
      
    case ACTIVITY_ACTIONS.UPLOAD_DESIGN_DOCUMENT:
    case ACTIVITY_ACTIONS.UPDATE_DESIGN_DOCUMENT:
      description = `${metadata.name || 'Documento'}${metadata.folder_name ? ` en ${metadata.folder_name}` : ''}`;
      break;
      
    case ACTIVITY_ACTIONS.CREATE_TASK:
    case ACTIVITY_ACTIONS.UPDATE_TASK:
    case ACTIVITY_ACTIONS.COMPLETE_TASK:
      description = `${metadata.title || metadata.name || 'Tarea'}${metadata.description ? ` - ${metadata.description}` : ''}`;
      break;
      
    case ACTIVITY_ACTIONS.ADD_CONTACT:
    case ACTIVITY_ACTIONS.UPDATE_CONTACT:
      description = `${metadata.first_name || ''} ${metadata.last_name || ''}${metadata.company_name ? ` de ${metadata.company_name}` : ''}`.trim();
      break;
      
    default:
      description = `Actividad en ${target_table}`;
  }

  return {
    ...info,
    description: description || `Actividad en ${target_table}`,
    title: info.label
  };
}