import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';
import { Layout as DashboardLayout } from '@/layouts/dashboard/DashboardLayout';
import { LabPageLayout } from '@/layouts/lab/components/LabPageLayout';
import { useLab } from '@/layouts/lab/context/LabContext';
import { NeuralNetworkGraph, GraphData, SatelliteNode } from '@/components/lab/neural-network';
import { NodeRenderer, NodeRendererContext } from '@/components/lab/neural-network/renderers/types';
import { useContacts, ContactWithRelations } from '@/features/contacts';
import { getContactAvatarUrl } from '@/lib/storage/uploadHelpers';
import { Loader2 } from 'lucide-react';
import { NodeObject } from 'react-force-graph-2d';
import { CoreNode } from '@/components/lab/neural-network/types';

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
  'otro': 'hsl(270, 60%, 55%)',
  'sin tipo': 'hsl(210, 15%, 50%)',
  'default': 'hsl(210, 15%, 50%)',
};

function getGroupColor(typeName?: string): string {
  if (!typeName) return GROUP_COLORS.default;
  const normalized = typeName.toLowerCase().trim();
  return GROUP_COLORS[normalized] || GROUP_COLORS.default;
}

function getInitials(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return label.substring(0, 2).toUpperCase();
}

const ContactsNodeRenderer: NodeRenderer = {
  renderCore: (
    node: CoreNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { globalScale } = context;

    const size = 50;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'hsl(210, 20%, 25%)' : 'hsl(210, 20%, 85%)';
    const borderColor = isDark ? 'hsl(210, 30%, 45%)' : 'hsl(210, 30%, 65%)';

    ctx.shadowColor = isDark ? 'rgba(100, 150, 200, 0.3)' : 'rgba(50, 100, 150, 0.2)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.stroke();

    const textColor = isDark ? 'hsl(210, 20%, 90%)' : 'hsl(210, 20%, 20%)';
    ctx.fillStyle = textColor;
    ctx.font = `bold ${14 / globalScale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label.substring(0, 12), x, y);
  },

  renderSatellite: (
    node: SatelliteNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { globalScale, imageCache } = context;

    const isTypeNode = node.metadata?.isTypeNode as boolean;
    const groupColor = (node.metadata?.groupColor as string) || getGroupColor(node.metadata?.groupType as string);
    const avatarUrl = node.metadata?.avatarUrl as string | undefined;

    if (isTypeNode) {
      const size = 30;
      const isDark = document.documentElement.classList.contains('dark');

      ctx.shadowColor = groupColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = groupColor;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${11 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = node.label.length > 10 ? node.label.substring(0, 8) + '...' : node.label;
      ctx.fillText(label, x, y);

      const count = node.metadata?.count as number;
      if (count && globalScale > 0.8) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.font = `${9 / globalScale}px Inter, system-ui, sans-serif`;
        ctx.fillText(`(${count})`, x, y + size + 10);
      }
    } else {
      const size = 18;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.clip();

      let imageLoaded = false;
      if (avatarUrl && imageCache) {
        const cachedImage = imageCache.get(avatarUrl);
        if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
          ctx.drawImage(cachedImage, x - size, y - size, size * 2, size * 2);
          imageLoaded = true;
        } else if (!cachedImage) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = avatarUrl;
          imageCache.set(avatarUrl, img);
        }
      }

      if (!imageLoaded) {
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? 'hsl(220, 15%, 30%)' : 'hsl(220, 15%, 92%)';
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);

        const initials = getInitials(node.label);
        ctx.fillStyle = groupColor;
        ctx.font = `bold ${size * 0.8}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, x, y);
      }

      ctx.restore();

      ctx.strokeStyle = groupColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.stroke();

      if (globalScale > 1.5) {
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? 'hsl(0, 0%, 85%)' : 'hsl(0, 0%, 25%)';
        ctx.fillStyle = textColor;
        ctx.font = `${10 / globalScale}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const shortLabel = node.label.split(' ')[0].substring(0, 10);
        ctx.fillText(shortLabel, x, y + size + 6);

        const groupType = node.metadata?.groupType as string;
        if (groupType) {
          ctx.fillStyle = groupColor;
          ctx.font = `${8 / globalScale}px Inter, system-ui, sans-serif`;
          ctx.fillText(groupType, x, y + size + 18);
        }
      }
    }
  },
};

function ContactsLabContent() {
  const { selectedOrgId } = useLab();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedContact, setSelectedContact] = useState<SatelliteNode | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);

  const { data: contacts = [], isLoading } = useContacts(selectedOrgId ?? undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setAvatarUrls({});
    setAvatarsLoaded(false);
  }, [selectedOrgId]);

  useEffect(() => {
    const loadAvatars = async () => {
      const urls: Record<string, string> = {};
      
      const promises = contacts.map(async (contact) => {
        if (contact.image_bucket && contact.image_path) {
          try {
            const url = await getContactAvatarUrl(contact.id);
            if (url) {
              urls[contact.id] = url;
            }
          } catch (e) {
            console.warn('Failed to load avatar for', contact.id, e);
          }
        }
      });
      
      await Promise.all(promises);
      setAvatarUrls(urls);
      setAvatarsLoaded(true);
    };

    if (contacts.length > 0) {
      loadAvatars();
    } else {
      setAvatarsLoaded(true);
    }
  }, [contacts]);

  const typeCountMap = useMemo(() => {
    const countMap: Record<string, number> = {};
    contacts.forEach((contact: ContactWithRelations) => {
      const types = contact.contact_types || [];
      if (types.length > 0) {
        const primaryType = types[0].name;
        countMap[primaryType] = (countMap[primaryType] || 0) + 1;
      } else {
        countMap['Sin tipo'] = (countMap['Sin tipo'] || 0) + 1;
      }
    });
    return countMap;
  }, [contacts]);

  const graphData: GraphData = useMemo(() => {
    const nodes: GraphData['nodes'] = [];
    const links: GraphData['links'] = [];

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    nodes.push({
      id: 'core',
      label: 'CONTACTOS',
      type: 'core',
      fx: centerX,
      fy: centerY,
    });

    const uniqueTypes = Object.keys(typeCountMap);
    const typeRadius = Math.min(dimensions.width, dimensions.height) * 0.22;

    uniqueTypes.forEach((typeName, idx) => {
      const angle = (idx / uniqueTypes.length) * 2 * Math.PI - Math.PI / 2;
      const typeX = centerX + Math.cos(angle) * typeRadius;
      const typeY = centerY + Math.sin(angle) * typeRadius;

      nodes.push({
        id: `type-${typeName}`,
        label: typeName,
        type: 'satellite',
        status: 'healthy',
        value: 100,
        maxValue: 100,
        currentValue: 100,
        fx: typeX,
        fy: typeY,
        metadata: {
          isTypeNode: true,
          groupType: typeName,
          groupColor: getGroupColor(typeName),
          count: typeCountMap[typeName],
        },
      });

      links.push({
        source: 'core',
        target: `type-${typeName}`,
      });
    });

    contacts.forEach((contact: ContactWithRelations) => {
      const types = contact.contact_types || [];
      const primaryType = types.length > 0 ? types[0].name : 'Sin tipo';

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
        metadata: {
          isTypeNode: false,
          groupType: primaryType,
          groupColor: getGroupColor(primaryType),
          avatarUrl: avatarUrls[contact.id] || undefined,
          allTypes: types.map(t => t.name),
          email: contact.email,
          phone: contact.phone,
          company: contact.company_name,
        },
      });

      links.push({
        source: `type-${primaryType}`,
        target: contact.id,
      });
    });

    return { nodes, links };
  }, [contacts, avatarUrls, dimensions, typeCountMap]);

  const handleNodeClick = useCallback((node: SatelliteNode) => {
    if (node.metadata?.isTypeNode) {
      return;
    }
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
        nodeRenderer={ContactsNodeRenderer}
        onNodeClick={handleNodeClick}
        graphRef={graphRef}
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
