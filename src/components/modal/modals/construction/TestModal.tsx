import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { TestTube } from 'lucide-react';

interface TestModalProps {
  modalData: any;
  onClose: () => void;
}

export function TestModal({ modalData, onClose }: TestModalProps) {
  const viewPanel = (
    <div className="p-6">
      <p>Modal de prueba funcionando correctamente!</p>
      <p>Datos recibidos: {JSON.stringify(modalData)}</p>
    </div>
  );

  const editPanel = viewPanel;

  const headerContent = (
    <FormModalHeader 
      title="Modal de Prueba"
      icon={TestTube}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
      rightLabel="OK"
      onRightClick={onClose}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}