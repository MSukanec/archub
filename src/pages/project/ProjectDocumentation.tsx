import React, { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DocumentHierarchy } from '@/components/ui-custom/DocumentHierarchy';
import { DocumentPreview } from '@/components/ui-custom/DocumentPreview';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { FileText, FolderPlus } from 'lucide-react';

export default function ProjectDocumentation() {
  const { openModal } = useGlobalModalStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

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
        {/* Document Preview Card */}
        <DocumentPreview 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)} 
        />
        
        {/* Document Hierarchy */}
        <DocumentHierarchy onDocumentSelect={setSelectedDocument} />
      </div>
    </Layout>
  );
}