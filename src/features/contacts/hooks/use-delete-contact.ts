import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteContact } from '../services';
import { contactsKeys } from '@/core/query-keys';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

interface DeleteContactParams {
  contactId: string;
  organizationId: string;
  userId?: string;
  contactName?: string;
}

export function useDeleteContact(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: async ({ contactId, organizationId, userId, contactName }: DeleteContactParams) => {
      const result = await softDeleteContact(contactId, organizationId);
      
      // Log activity after successful deletion
      if (organizationId && userId) {
        logActivity({
          organization_id: organizationId,
          user_id: userId,
          action: ACTIVITY_ACTIONS.DELETE_CONTACT,
          target_table: TARGET_TABLES.CONTACTS,
          target_id: contactId,
          metadata: { name: contactName }
        });
      }
      
      return result;
    },
    queryKey: contactsKeys.list(organizationId),
    optimisticUpdate: (oldData, { contactId }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((c: any) => c.id !== contactId);
    },
    onSuccessMessage: 'Contacto eliminado',
    onErrorMessage: 'No se pudo eliminar el contacto',
  });
}
