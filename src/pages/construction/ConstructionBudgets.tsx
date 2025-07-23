import React, { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Plus, Calculator, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { EmptyState } from '@/components/ui-custom/EmptyState';

export default function ConstructionBudgets() {
  const [searchValue, setSearchValue] = useState('');
  const [groupingType, setGroupingType] = useState('none');

  return (
    <Layout
      headerProps={{
        title: "Presupuestos de Construcción",
        subtitle: "Gestiona y controla los costos de tu proyecto de construcción"
      }}
    >
      <div className="space-y-6">
        {/* Features Introduction */}
        <FeatureIntroduction
          title="Gestión de Presupuestos"
          features={[
            {
              icon: <Calculator className="w-4 h-4" />,
              title: "Presupuestos Detallados",
              description: "Crea presupuestos completos con tareas, cantidades y costos unitarios para un control preciso."
            },
            {
              icon: <Plus className="w-4 h-4" />,
              title: "Librería de Tareas",
              description: "Accede a una amplia biblioteca de tareas predefinidas para agilizar la creación de presupuestos."
            },
            {
              icon: <BarChart3 className="w-4 h-4" />,
              title: "Control de Costos",
              description: "Monitorea el progreso y los totales de tu presupuesto en tiempo real con actualizaciones automáticas."
            }
          ]}
        />

        {/* Action Bar Desktop */}
        <ActionBarDesktop
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showGrouping={true}
          groupingType={groupingType}
          onGroupingChange={setGroupingType}
          primaryActionLabel="Nuevo Presupuesto"
          onPrimaryActionClick={() => console.log('Nuevo presupuesto')}
          customActions={[
            <Button 
              key="nueva-tarea"
              variant="secondary" 
              onClick={() => console.log('Nueva tarea')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tarea
            </Button>
          ]}
        />

        {/* Empty State */}
        <EmptyState
          icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
          title="No hay presupuestos creados"
          description="Comienza creando tu primer presupuesto para gestionar los costos del proyecto"
          action={
            <Button onClick={() => console.log('Crear primer presupuesto')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Presupuesto
            </Button>
          }
        />
      </div>
    </Layout>
  )
}