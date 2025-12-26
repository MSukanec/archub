import { DollarSign } from 'lucide-react'
import { ClientCommitmentForm } from '../forms/ClientCommitmentForm'
interface ClientCommitmentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    commitmentId?: string;
  };
  onClose: () => void;
  mode?: 'create'| 'edit'| 'view';
}
export function ClientCommitmentModal({ modalData, onClose, mode = 'create'}: ClientCommitmentModalProps) {
  return (
    <ClientCommitmentForm
      modalData={modalData}
      onClose={onClose}
      mode={mode}
    />
  )
}
export default ClientCommitmentModal
