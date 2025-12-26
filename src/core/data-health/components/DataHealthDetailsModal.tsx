import { AlertTriangle } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { DataHealthDetailsContent } from './DataHealthDetailsContent';
import type { DataIssue } from '../types';
import { getRuleIcon } from '../rules/micro';
export interface DataHealthDetailsModalProps {
  modalData?: {
    issue?: DataIssue;
  };
  onClose: () => void;
}
const severityDescriptions: Record<string, string> = {
  critical: 'Este problema requiere atención inmediata.',
  warning: 'Este problema debería resolverse pronto.',
  info: 'Este problema es informativo.',
};
export function DataHealthDetailsModal({ modalData, onClose }: DataHealthDetailsModalProps) {
  const issue = modalData?.issue;
  if (!issue) {
    return null;
  }
  const Icon = getRuleIcon(issue.ruleId);
  const headerContent = (
    <ModalHeader
      title="Detalle del problema"
      description={severityDescriptions[issue.severity] || 'Información sobre el problema detectado.'}
      icon={Icon || AlertTriangle}
    />
  );
  const footerContent = (
    <ModalFooter
      submitText="Cerrar"
      onSubmit={onClose}
    />
  );
  return (
    <ModalLayout
      onClose={onClose}
      size="lg"
      headerContent={headerContent}
      footerContent={footerContent}
    >
      <ModalBody>
        <DataHealthDetailsContent issue={issue} />
      </ModalBody>
    </ModalLayout>
  );
}
