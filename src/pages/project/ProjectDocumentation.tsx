import React from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentHierarchy } from '@/components/ui-custom/DocumentHierarchy';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { FileText, FolderPlus } from 'lucide-react';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();

  const headerProps = {
    icon: FileText,
    title: "Documentación",
    actionButton: {
      label: "Nueva Carpeta",
      icon: FolderPlus,
      onClick: () => {
        openModal('document-folder', {});
      }
    }
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
        <DocumentHierarchy />
      </div>
    </Layout>
  );
}