import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderTree } from 'lucide-react';

const AdminTaskCategories = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Gestión de Categorías de Tareas</p>
            <p className="text-xs">Aquí se gestionarán las categorías de tareas del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaskCategories;