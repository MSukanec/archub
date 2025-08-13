import React, { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentHierarchy } from '@/components/ui-custom/DocumentHierarchy';
import { DocumentPreviewModal } from '@/components/modal/modals/project/DocumentPreviewModal';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { FileText, FolderPlus } from 'lucide-react';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Document Hierarchy */}
      <DocumentHierarchy onDocumentSelect={handleDocumentSelect} />
      
      {/* Document Preview Modal */}
      <DocumentPreviewModal 
        document={selectedDocument}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </Layout>
  );
}