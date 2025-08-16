import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const AdminGeneralMovementConcepts = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Gestión de Conceptos de Movimientos</p>
            <p className="text-xs">Aquí se gestionarán los conceptos de movimientos financieros del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGeneralMovementConcepts;