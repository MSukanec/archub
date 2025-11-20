import { ACTIVITY_ACTIONS } from '@/utils/logActivity';
import type { ActivityLog, ActivityDisplayInfo } from '../types';

/**
 * Obtiene información de display para un log de actividad.
 * 
 * Transforma el log de actividad en información visual que incluye:
 * - Icono apropiado según el tipo de acción
 * - Label descriptivo de la acción
 * - Color para UI
 * - Descripción detallada basada en metadata
 * 
 * @param log - Log de actividad a procesar
 * @returns Información de display con icon, label, color, description y title
 */
export function getActivityDisplayInfo(log: ActivityLog): ActivityDisplayInfo {
  const { action, target_table, metadata } = log;

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
