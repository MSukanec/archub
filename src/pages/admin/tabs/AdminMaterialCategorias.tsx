import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

const AdminMaterialCategorias = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Gestión de Categorías</p>
            <p className="text-xs">Aquí se gestionarán las categorías del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMaterialCategorias;