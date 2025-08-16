import { TreePine } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ParameterNodeEditor } from '@/components/ui-custom/ParameterNodeEditor';

export default function AdminTaskFlow() {
  const headerProps = {
    title: 'Flujo de Parámetros',
    icon: TreePine
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        <ParameterNodeEditor />
      </div>
    </Layout>
  );
}