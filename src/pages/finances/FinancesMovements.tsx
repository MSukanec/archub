import { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMovements } from '@/hooks/use-movements';

export default function FinancesMovements() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: movements = [], isLoading } = useMovements(organizationId, userData?.preferences?.last_project_id);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Movimientos Financieros</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">
            Cargando movimientos...
          </div>
        ) : (
          <div className="space-y-4">
            {movements.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay movimientos registrados aún.
                  </p>
                </CardContent>
              </Card>
            ) : (
              movements.map((movement: any) => (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{movement.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ${movement.amount.toLocaleString()}
                        </p>
                        <Badge variant="secondary">
                          {movement.amount > 0 ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}