import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/layouts';
import { LabPageLayout } from '@/layouts/lab/components/LabPageLayout';
import { useLab } from '@/layouts/lab/context/LabContext';
import { NeuralNetworkGraph, AvatarNodeRenderer, GraphData, SatelliteNode } from '@/components/lab/neural-network';
import { useContacts, ContactWithRelations } from '@/features/contacts';
import { getContactAvatarUrl } from '@/lib/storage/uploadHelpers';
import { Loader2 } from 'lucide-react';

const GROUP_COLORS: Record<string, string> = {
  'albañil': 'hsl(220, 70%, 50%)',
  'cliente': 'hsl(150, 70%, 45%)',
  'arquitecto': 'hsl(280, 70%, 50%)',
  'ingeniero': 'hsl(35, 90%, 55%)',
  'proveedor': 'hsl(0, 70%, 55%)',
  'electricista': 'hsl(45, 90%, 50%)',
  'plomero': 'hsl(190, 70%, 45%)',
  'pintor': 'hsl(320, 70%, 50%)',
  'carpintero': 'hsl(25, 80%, 45%)',
  'default': 'hsl(210, 15%, 50%)',
};

function getGroupColor(typeName?: string): string {
  if (!typeName) return GROUP_COLORS.default;
  const normalized = typeName.toLowerCase().trim();
  return GROUP_COLORS[normalized] || GROUP_COLORS.default;
}

function ContactsLabContent() {
  const { selectedOrgId } = useLab();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedContact, setSelectedContact] = useState<SatelliteNode | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  const { data: contacts = [], isLoading } = useContacts(selectedOrgId ?? undefined);

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

  useEffect(() => {
    const loadAvatars = async () => {
      const urls: Record<string, string> = {};
      for (const contact of contacts) {
        if (contact.image_bucket && contact.image_path) {
          try {
            const url = await getContactAvatarUrl(contact.id);
            if (url) {
              urls[contact.id] = url;
            }
          } catch {
          }
        }
      }
      setAvatarUrls(urls);
    };

    if (contacts.length > 0) {
      loadAvatars();
    }
  }, [contacts]);

  const typeCountMap = useMemo(() => {
    const countMap: Record<string, number> = {};
    contacts.forEach((contact: ContactWithRelations) => {
      const types = contact.contact_types || [];
      if (types.length > 0) {
        types.forEach(t => {
          countMap[t.name] = (countMap[t.name] || 0) + 1;
        });
      } else {
        countMap['Sin tipo'] = (countMap['Sin tipo'] || 0) + 1;
      }
    });
    return countMap;
  }, [contacts]);

  const graphData: GraphData = useMemo(() => {
    const nodes: GraphData['nodes'] = [
      {
        id: 'core',
        label: 'CONTACTOS',
        type: 'core',
      },
    ];

    const links: GraphData['links'] = [];

    const typeAngles: Record<string, number> = {};
    const uniqueTypes = Array.from(new Set(
      contacts.flatMap((c: ContactWithRelations) => 
        (c.contact_types || []).map(t => t.name)
      ).concat(['Sin tipo'])
    ));
    
    uniqueTypes.forEach((typeName, idx) => {
      typeAngles[typeName] = (idx / uniqueTypes.length) * 2 * Math.PI;
    });

    const typeCounters: Record<string, number> = {};
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.3;

    contacts.forEach((contact: ContactWithRelations) => {
      const types = contact.contact_types || [];
      const primaryType = types.length > 0 ? types[0].name : 'Sin tipo';
      
      typeCounters[primaryType] = (typeCounters[primaryType] || 0) + 1;
      const countInType = typeCounters[primaryType];
      const totalInType = typeCountMap[primaryType] || 1;
      
      const angle = typeAngles[primaryType] || 0;
      const spreadAngle = (Math.PI / 4) / Math.max(totalInType, 1);
      const nodeAngle = angle + (countInType - totalInType / 2) * spreadAngle;
      
      const radiusVariation = 0.7 + Math.random() * 0.6;
      const radius = baseRadius * radiusVariation;
      
      const x = centerX + Math.cos(nodeAngle) * radius;
      const y = centerY + Math.sin(nodeAngle) * radius;

      const displayName = contact.display_name_override || 
        `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
        contact.email || 
        'Contacto';

      nodes.push({
        id: contact.id,
        label: displayName,
        type: 'satellite',
        status: 'healthy',
        value: 100,
        maxValue: 100,
        currentValue: 100,
        x,
        y,
        metadata: {
          groupType: primaryType,
          avatarUrl: avatarUrls[contact.id] || undefined,
          allTypes: types.map(t => t.name),
          email: contact.email,
          phone: contact.phone,
          company: contact.company_name,
        },
      });

      links.push({
        source: 'core',
        target: contact.id,
      });
    });

    return { nodes, links };
  }, [contacts, avatarUrls, dimensions, typeCountMap]);

  const handleNodeClick = useCallback((node: SatelliteNode) => {
    setSelectedContact(node);
  }, []);

  if (isLoading) {
    return (
      <div className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden flex items-center justify-center">
        <div className="bg-[var(--card-bg)]/60 backdrop-blur-md rounded-xl border border-[var(--border)] p-8 text-center max-w-md">
          <p className="text-[var(--text-muted)]">
            No hay contactos en esta organización.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden" ref={containerRef}>
      <NeuralNetworkGraph
        data={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeRenderer={AvatarNodeRenderer}
        onNodeClick={handleNodeClick}
      />

      {selectedContact && (() => {
        const meta = selectedContact.metadata as Record<string, string | string[]> | undefined;
        const allTypes = (meta?.allTypes as string[]) || [];
        const email = meta?.email as string | undefined;
        const phone = meta?.phone as string | undefined;
        const company = meta?.company as string | undefined;
        
        return (
          <div className="absolute bottom-4 left-4 bg-[var(--card-bg)]/90 backdrop-blur-md rounded-lg border border-[var(--border)] p-4 max-w-xs">
            <h4 className="font-semibold text-[var(--foreground)]">{selectedContact.label}</h4>
            <p className="text-sm text-[var(--text-muted)] capitalize">
              {allTypes.length > 0 ? allTypes.join(', ') : 'Sin tipo'}
            </p>
            {email && (
              <p className="text-xs text-[var(--text-subtle)] mt-1">{email}</p>
            )}
            {phone && (
              <p className="text-xs text-[var(--text-subtle)]">{phone}</p>
            )}
            {company && (
              <p className="text-xs text-[var(--text-subtle)]">{company}</p>
            )}
            <button
              onClick={() => setSelectedContact(null)}
              className="mt-3 text-xs text-[var(--text-subtle)] hover:text-[var(--foreground)] underline"
              data-testid="button-close-contact-detail"
            >
              Cerrar
            </button>
          </div>
        );
      })()}

      <div className="absolute top-4 right-4 bg-[var(--card-bg)]/80 backdrop-blur-md rounded-lg border border-[var(--border)] p-3">
        <h4 className="text-xs font-semibold text-[var(--foreground)] mb-2">Tipos de Contacto</h4>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {Object.entries(typeCountMap).sort((a, b) => b[1] - a[1]).map(([typeName, count]) => (
            <div key={typeName} className="flex items-center gap-2 text-xs">
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getGroupColor(typeName) }} 
              />
              <span className="text-[var(--text-muted)] truncate">{typeName}</span>
              <span className="text-[var(--text-subtle)]">({count})</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-subtle)]">
            Total: {contacts.length} contactos
          </p>
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
