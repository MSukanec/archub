import React from 'react';
import { Table } from '@/components/ui-custom/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Generar datos de ejemplo para pruebas
const generateSampleData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Elemento ${i + 1}`,
    status: ['Activo', 'Inactivo', 'Pendiente'][i % 3],
    amount: Math.floor(Math.random() * 100000),
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    category: ['Categoria A', 'Categoria B', 'Categoria C'][i % 3]
  }));
};

export const VirtualTableExample: React.FC = () => {
  const sampleData = generateSampleData(10000); // 10k elementos para probar performance

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      sortable: true,
      sortType: 'number' as const
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item: any) => (
        <Badge variant={item.status === 'Activo' ? 'default' : item.status === 'Pendiente' ? 'secondary' : 'destructive'}>
          {item.status}
        </Badge>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (item: any) => `$${item.amount.toLocaleString()}`,
      sortable: true,
      sortType: 'number' as const,
      width: '120px'
    },
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      sortType: 'date' as const,
      width: '120px'
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      sortType: 'string' as const
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Prueba de Scroll Virtual</h2>
        <p className="text-muted-foreground">
          Tabla con {sampleData.length.toLocaleString()} elementos usando scroll virtual
        </p>
      </div>

      {/* Tabla con Virtual Scroll */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🔥 Con Virtual Scroll (600px altura)</h3>
        <Table
          columns={columns}
          data={sampleData}
          enableVirtualScroll={true}
          virtualScrollHeight={600}
          estimateSize={44}
          selectable={true}
          defaultSort={{ key: 'id', direction: 'asc' }}
          headerActions={{
            leftActions: (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Filtrar</Button>
                <Button variant="outline" size="sm">Exportar</Button>
              </div>
            ),
            rightActions: (
              <Button size="sm">Nuevo Elemento</Button>
            )
          }}
        />
      </div>

      {/* Comparación sin Virtual Scroll (solo primeros 100 elementos) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">📊 Sin Virtual Scroll (100 elementos)</h3>
        <Table
          columns={columns}
          data={sampleData.slice(0, 100)}
          enableVirtualScroll={false}
          selectable={true}
          defaultSort={{ key: 'id', direction: 'asc' }}
        />
      </div>

      {/* Con Agrupamiento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🔄 Con Virtual Scroll + Agrupamiento</h3>
        <Table
          columns={columns}
          data={sampleData.slice(0, 1000)} // Menos elementos para agrupamiento
          enableVirtualScroll={true}
          virtualScrollHeight={400}
          estimateSize={44}
          groupBy="category"
          renderGroupHeader={(groupKey, groupRows) => (
            <>
              <div className="col-span-full text-sm font-semibold">
                {groupKey} ({groupRows.length} elementos)
              </div>
            </>
          )}
          selectable={true}
        />
      </div>
    </div>
  );
};

export default VirtualTableExample;