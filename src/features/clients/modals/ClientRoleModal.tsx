import { ClientRoleForm } from '../forms/ClientRoleForm'
import type { ClientRole } from '../types'
interface ClientRoleModalProps {
  modalData?: {
    clientRole?: ClientRole;
  };
  onClose: () => void;
  mode?: 'create'| 'edit'| 'view';
}
export function ClientRoleModal({ modalData, onClose, mode = 'create'}: ClientRoleModalProps) {
  return (
    <ClientRoleForm
      modalData={modalData}
      onClose={onClose}
      mode={mode}
    />
  )
}
export default ClientRoleModal
