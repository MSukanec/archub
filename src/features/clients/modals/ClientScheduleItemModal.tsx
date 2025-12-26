import { ClientScheduleItemForm } from '../forms/ClientScheduleItemForm'
interface ClientScheduleItemModalProps {
  modalData?: {
    scheduleId?: string;
    projectId?: string;
    organizationId?: string;
    commitmentId?: string;
  };
  onClose: () => void;
  mode?: 'create'| 'edit'| 'view';
}
export function ClientScheduleItemModal({ modalData, onClose, mode = 'create'}: ClientScheduleItemModalProps) {
  return (
    <ClientScheduleItemForm
      modalData={modalData}
      onClose={onClose}
      mode={mode}
    />
  )
}
export default ClientScheduleItemModal
