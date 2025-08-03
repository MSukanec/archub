import React from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from '@/components/ui-custom/EmptyState';
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
      <div className="space-y-6">
        <EmptyState
          icon={<FolderPlus className="w-12 h-12" />}
          title="No hay carpetas de documentos"
          description="Comienza creando tu primera carpeta para organizar los documentos del proyecto."
        />
      </div>
    </Layout>
  );
}