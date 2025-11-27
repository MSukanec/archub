import { useMemo, useRef, useState, useEffect } from 'react';
import { DashboardLayout } from '@/layouts';
import { LabPageLayout } from '@/layouts/lab/components/LabPageLayout';
import { useLab } from '@/layouts/lab/context/LabContext';
import { NeuralNetworkGraph, AvatarNodeRenderer, GraphData, SatelliteNode } from '@/components/lab/neural-network';

const CONTACT_TYPES = [
  { type: 'albañil', label: 'Albañiles' },
  { type: 'cliente', label: 'Clientes' },
  { type: 'arquitecto', label: 'Arquitectos' },
  { type: 'ingeniero', label: 'Ingenieros' },
  { type: 'proveedor', label: 'Proveedores' },
  { type: 'electricista', label: 'Electricistas' },
  { type: 'plomero', label: 'Plomeros' },
];

const MOCK_CONTACTS = [
  { id: 'c1', name: 'Juan Pérez', type: 'albañil', avatarUrl: '' },
  { id: 'c2', name: 'María García', type: 'cliente', avatarUrl: '' },
  { id: 'c3', name: 'Carlos López', type: 'arquitecto', avatarUrl: '' },
  { id: 'c4', name: 'Ana Martínez', type: 'ingeniero', avatarUrl: '' },
  { id: 'c5', name: 'Pedro Sánchez', type: 'proveedor', avatarUrl: '' },
  { id: 'c6', name: 'Luis Rodríguez', type: 'electricista', avatarUrl: '' },
  { id: 'c7', name: 'Roberto Díaz', type: 'albañil', avatarUrl: '' },
  { id: 'c8', name: 'Elena Fernández', type: 'cliente', avatarUrl: '' },
  { id: 'c9', name: 'Miguel Torres', type: 'plomero', avatarUrl: '' },
  { id: 'c10', name: 'Sofia Ruiz', type: 'arquitecto', avatarUrl: '' },
  { id: 'c11', name: 'Diego Moreno', type: 'proveedor', avatarUrl: '' },
  { id: 'c12', name: 'Laura Castro', type: 'ingeniero', avatarUrl: '' },
];

function ContactsLabContent() {
  const { selectedOrgId } = useLab();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedContact, setSelectedContact] = useState<SatelliteNode | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const graphData: GraphData = useMemo(() => {
    const nodes: GraphData['nodes'] = [
      {
        id: 'core',
        label: 'CONTACTOS',
        type: 'core',
      },
    ];

    const links: GraphData['links'] = [];

    MOCK_CONTACTS.forEach((contact) => {
      nodes.push({
        id: contact.id,
        label: contact.name,
        type: 'satellite',
        status: 'healthy',
        value: 100,
        maxValue: 100,
        currentValue: 100,
        metadata: {
          groupType: contact.type,
          avatarUrl: contact.avatarUrl || undefined,
        },
      });

      links.push({
        source: 'core',
        target: contact.id,
      });
    });

    return { nodes, links };
  }, []);

  const handleNodeClick = (node: SatelliteNode) => {
    setSelectedContact(node);
  };

  return (
    <div className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden" ref={containerRef}>
      <NeuralNetworkGraph
        data={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeRenderer={AvatarNodeRenderer}
        onNodeClick={handleNodeClick}
      />

      {selectedContact && (
        <div className="absolute bottom-4 left-4 bg-[var(--card-bg)]/90 backdrop-blur-md rounded-lg border border-[var(--border)] p-4 max-w-xs">
          <h4 className="font-semibold text-[var(--foreground)]">{selectedContact.label}</h4>
          <p className="text-sm text-[var(--text-muted)] capitalize">
            {selectedContact.metadata?.groupType as string}
          </p>
          <button
            onClick={() => setSelectedContact(null)}
            className="mt-2 text-xs text-[var(--text-subtle)] hover:text-[var(--foreground)]"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 bg-[var(--card-bg)]/80 backdrop-blur-md rounded-lg border border-[var(--border)] p-3">
        <h4 className="text-xs font-semibold text-[var(--foreground)] mb-2">Tipos de Contacto</h4>
        <div className="space-y-1">
          {CONTACT_TYPES.map(({ type, label }) => {
            const count = MOCK_CONTACTS.filter(c => c.type === type).length;
            return (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ 
                  backgroundColor: type === 'albañil' ? 'hsl(220, 70%, 50%)' :
                    type === 'cliente' ? 'hsl(150, 70%, 45%)' :
                    type === 'arquitecto' ? 'hsl(280, 70%, 50%)' :
                    type === 'ingeniero' ? 'hsl(35, 90%, 55%)' :
                    type === 'proveedor' ? 'hsl(0, 70%, 55%)' :
                    type === 'electricista' ? 'hsl(45, 90%, 50%)' :
                    'hsl(190, 70%, 45%)'
                }} />
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="text-[var(--text-subtle)]">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrgId && (
        <div className="absolute bottom-4 right-4 text-xs text-[var(--text-subtle)]">
          Org: {selectedOrgId.slice(0, 8)}...
        </div>
      )}
    </div>
  );
}

export default function ContactsLabPage() {
  return (
    <DashboardLayout hideHeader wide>
      <LabPageLayout>
        <ContactsLabContent />
      </LabPageLayout>
    </DashboardLayout>
  );
}
