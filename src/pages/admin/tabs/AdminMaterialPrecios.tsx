import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const AdminMaterialPrecios = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Gestión de Precios</p>
            <p className="text-xs">Aquí se gestionarán los precios del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMaterialPrecios;