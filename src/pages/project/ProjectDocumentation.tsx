import React from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { FileText } from 'lucide-react';

export default function ProjectDocumentation() {
  const headerProps = {
    icon: FileText,
    title: "Documentación"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Página completamente vacía */}
      </div>
    </Layout>
  );
}