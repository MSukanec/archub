import { ClientForm } from '../forms/ClientForm'

interface ClientModalProps {
  modalData?: {
    projectId?: string;
    clientId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientModal({ modalData, onClose, mode = 'create' }: ClientModalProps) {
  return (
    <ClientForm
      modalData={modalData}
      onClose={onClose}
      mode={mode}
    />
  )
}

export default ClientModal
