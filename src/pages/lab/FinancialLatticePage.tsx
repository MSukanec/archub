import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, AlertTriangle, Clock, DollarSign, Users, Loader2, Network, Grid3X3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Layout as DashboardLayout } from '@/layouts/dashboard/DashboardLayout';
import { LabPageLayout } from '@/layouts/lab/components/LabPageLayout';
import { useLab } from '@/layouts/lab/context/LabContext';
import { 
  NeuralNetworkGraph, 
  SatelliteNode, 
  GraphData, 
  NodeStatus,
} from '@/components/lab/neural-network';
import { StatusHeatmap, HeatmapCell } from '@/components/lab/heatmap';

type ViewMode = 'network' | 'heatmap';

interface ClientsSummaryResponse {
  plan: { slug: string; isMultiCurrency: boolean };
  clients: Array<{
    id: string;
    contacts: {
      id: string;
      first_name: string;
      last_name: string;
      full_name: string;
      email?: string;
      phone?: string;
    };
    total_committed_amount: number;
    total_paid_amount: number;
    balance_due: number;
    financialByCurrency: Array<{
      currency: { code: string; symbol: string };
      total_committed_amount: number;
      total_paid_amount: number;
      balance_due: number;
      last_payment_date: string | null;
    }>;
  }>;
}

interface ClientNodeData extends SatelliteNode {
  email?: string;
  phone?: string;
  debtAmount: number;
  totalCommitted: number;
  totalPaid: number;
  lastInteraction: Date;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getDaysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function determineStatus(balanceDue: number, totalCommitted: number): NodeStatus {
  if (totalCommitted === 0) return 'healthy';
  const percentOwed = (balanceDue / totalCommitted) * 100;
  
  if (balanceDue <= 0 || percentOwed < 5) return 'healthy';
  if (percentOwed < 30) return 'warning';
  return 'critical';
}

async function fetchClientsSummary(projectId: string, organizationId: string): Promise<ClientsSummaryResponse | null> {
  if (!projectId || !organizationId) return null;
  
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  if (!token) return null;
  
  const response = await fetch(`/api/projects/${projectId}/clients/summary?organization_id=${organizationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) return null;
  return response.json();
}

function FinancialLatticeContent() {
  const graphRef = useRef<ForceGraphMethods | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<ClientNodeData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  
  const { selectedOrgId, selectedProjectId, selectedProject, isLoading: contextLoading } = useLab();
  
  const { data: clientsSummary, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-summary-lattice', selectedProjectId, selectedOrgId],
    queryFn: () => fetchClientsSummary(selectedProjectId!, selectedOrgId!),
    enabled: !!selectedProjectId && !!selectedOrgId,
  });
  
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
  
  const clientNodes: ClientNodeData[] = useMemo(() => {
    if (!clientsSummary?.clients) return [];
    
    return clientsSummary.clients.map((client, index) => {
      const lastPaymentDate = client.financialByCurrency?.[0]?.last_payment_date;
      const status = determineStatus(client.balance_due, client.total_committed_amount);
      
      return {
        id: `client-${client.id}`,
        label: client.contacts?.full_name || 'Sin nombre',
        sublabel: `C-${String(index + 1).padStart(2, '0')}`,
        status,
        value: Math.max(0, client.balance_due),
        maxValue: client.total_committed_amount,
        currentValue: client.total_paid_amount,
        type: 'satellite' as const,
        email: client.contacts?.email,
        phone: client.contacts?.phone,
        debtAmount: Math.max(0, client.balance_due),
        totalCommitted: client.total_committed_amount,
        totalPaid: client.total_paid_amount,
        lastInteraction: lastPaymentDate ? new Date(lastPaymentDate) : new Date(),
      };
    });
  }, [clientsSummary]);
  
  const graphData: GraphData = useMemo(() => {
    const coreNode = {
      id: 'core',
      label: selectedProject?.name || 'CORE',
      type: 'core' as const,
      fx: 0,
      fy: 0,
    };
    
    const nodes = [coreNode, ...clientNodes];
    
    const links = clientNodes.map(client => ({
      source: 'core',
      target: client.id,
    }));
    
    return { nodes, links };
  }, [clientNodes, selectedProject]);

  const heatmapCells: HeatmapCell[] = useMemo(() => {
    return clientNodes.map(node => ({
      id: node.id,
      label: node.label,
      sublabel: node.sublabel,
      status: node.status,
      value: node.debtAmount,
      maxValue: node.totalCommitted,
      currentValue: node.totalPaid,
      metadata: {
        email: node.email,
        phone: node.phone,
        lastInteraction: node.lastInteraction,
      },
    }));
  }, [clientNodes]);
  
  const handleNodeClick = useCallback((node: SatelliteNode) => {
    const clientNode = clientNodes.find(c => c.id === node.id);
    if (clientNode) {
      setSelectedNode(clientNode);
    }
  }, [clientNodes]);
  
  const handleCellClick = useCallback((cell: HeatmapCell) => {
    const clientNode = clientNodes.find(c => c.id === cell.id);
    if (clientNode) {
      setSelectedNode(clientNode);
    }
  }, [clientNodes]);
  
  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
    
    if (graphRef.current && viewMode === 'network') {
      graphRef.current.centerAt(0, 0, 800);
      graphRef.current.zoom(1, 800);
    }
  }, [viewMode]);
  
  const stats = useMemo(() => {
    const critical = clientNodes.filter(c => c.status === 'critical');
    const warning = clientNodes.filter(c => c.status === 'warning');
    const healthy = clientNodes.filter(c => c.status === 'healthy');
    const totalDebt = clientNodes.reduce((sum, c) => sum + c.debtAmount, 0);
    const totalCommitted = clientNodes.reduce((sum, c) => sum + c.totalCommitted, 0);
    const totalPaid = clientNodes.reduce((sum, c) => sum + c.totalPaid, 0);
    
    return { 
      critical: critical.length, 
      warning: warning.length, 
      healthy: healthy.length, 
      totalDebt,
      totalCommitted,
      totalPaid,
      totalClients: clientNodes.length,
    };
  }, [clientNodes]);

  const isLoading = contextLoading || clientsLoading;
  const hasNoClients = !isLoading && clientNodes.length === 0 && selectedProjectId;

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[var(--card-bg)]/80 backdrop-blur-md rounded-full border border-[var(--border)] p-1 flex gap-1">
          <button
            onClick={() => setViewMode('network')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              viewMode === 'network' 
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]" 
                : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover-bg)]"
            )}
            data-testid="button-view-network"
          >
            <Network className="w-4 h-4" />
            Red Neuronal
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              viewMode === 'heatmap' 
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]" 
                : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover-bg)]"
            )}
            data-testid="button-view-heatmap"
          >
            <Grid3X3 className="w-4 h-4" />
            Mapa de Calor
          </button>
        </div>
      </div>
      
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-[var(--card-bg)]/60 backdrop-blur-md rounded-lg border border-[var(--border)] p-4">
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">Financial Neural Lattice</h1>
          <p className="text-sm text-[var(--text-muted)]">Visualización orgánica del estado financiero</p>
        </div>
        
        <div className="bg-[var(--card-bg)]/60 backdrop-blur-md rounded-lg border border-[var(--border)] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
            <Users className="w-3 h-3" />
            <span>Clientes: {stats.totalClients}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--destructive)] animate-pulse" />
            <span className="text-sm text-[var(--foreground)]">Críticos: {stats.critical}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
            <span className="text-sm text-[var(--foreground)]">Alerta: {stats.warning}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
            <span className="text-sm text-[var(--foreground)]">Saludables: {stats.healthy}</span>
          </div>
          
          <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Deuda Total:</span>
              <span className="text-[var(--destructive)] font-medium">{formatCurrency(stats.totalDebt)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Comprometido:</span>
              <span className="text-[var(--foreground)]">{formatCurrency(stats.totalCommitted)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Pagado:</span>
              <span className="text-[var(--success)]">{formatCurrency(stats.totalPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'network' && dimensions.width > 0 && dimensions.height > 0 && (
        <NeuralNetworkGraph
          data={graphData}
          width={dimensions.width}
          height={dimensions.height}
          onNodeClick={handleNodeClick}
          graphRef={graphRef}
        />
      )}
      
      {viewMode === 'heatmap' && (
        <StatusHeatmap
          cells={heatmapCells}
          onCellClick={handleCellClick}
          formatValue={(v) => `Debe: ${formatCurrency(v)}`}
          emptyMessage="No hay clientes para mostrar"
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]/50 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
            <p className="text-[var(--text-muted)] text-sm">Cargando datos...</p>
          </div>
        </div>
      )}
      
      {hasNoClients && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-[var(--card-bg)]/60 backdrop-blur-md rounded-xl border border-[var(--border)] p-8 text-center max-w-md">
            <Users className="w-16 h-16 text-[var(--text-subtle)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Sin Clientes</h3>
            <p className="text-[var(--text-muted)] text-sm">
              Este proyecto no tiene clientes registrados. Agrega clientes para visualizar la red financiera.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-4 right-4 w-80 bg-[var(--card-bg)]/80 backdrop-blur-md rounded-xl border border-[var(--border)] overflow-hidden z-20"
            data-testid="panel-client-detail"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)]">Detalle del Cliente</h3>
              <button 
                onClick={handleCloseDetail}
                className="p-1 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors"
                data-testid="button-close-detail"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-[var(--foreground)] font-bold",
                    selectedNode.status === 'critical' && "bg-[var(--destructive)]/30",
                    selectedNode.status === 'warning' && "bg-[var(--warning)]/30",
                    selectedNode.status === 'healthy' && "bg-[var(--success)]/30",
                  )}
                >
                  {selectedNode.label.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{selectedNode.label}</p>
                  <p className="text-sm text-[var(--text-muted)]">{selectedNode.sublabel}</p>
                </div>
              </div>
              
              <div className={cn(
                "px-3 py-2 rounded-lg flex items-center gap-2",
                selectedNode.status === 'critical' && "bg-[var(--destructive)]/20",
                selectedNode.status === 'warning' && "bg-[var(--warning)]/20",
                selectedNode.status === 'healthy' && "bg-[var(--success)]/20",
              )}>
                <AlertTriangle className={cn(
                  "w-4 h-4",
                  selectedNode.status === 'critical' && "text-[var(--destructive)]",
                  selectedNode.status === 'warning' && "text-[var(--warning)]",
                  selectedNode.status === 'healthy' && "text-[var(--success)]",
                )} />
                <span className="text-sm text-[var(--foreground)]">
                  Estado: {selectedNode.status === 'critical' ? 'Crítico' : selectedNode.status === 'warning' ? 'Alerta' : 'Saludable'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Deuda</span>
                  </div>
                  <span className="font-semibold text-[var(--destructive)]">{formatCurrency(selectedNode.debtAmount)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Comprometido</span>
                  </div>
                  <span className="font-medium text-[var(--foreground)]">{formatCurrency(selectedNode.totalCommitted)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Pagado</span>
                  </div>
                  <span className="font-medium text-[var(--success)]">{formatCurrency(selectedNode.totalPaid)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Última interacción</span>
                  </div>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatDate(selectedNode.lastInteraction)} ({getDaysSince(selectedNode.lastInteraction)} días)
                  </span>
                </div>
              </div>
              
              <div className="border-t border-[var(--border)] pt-4 space-y-2">
                {selectedNode.email && (
                  <a 
                    href={`mailto:${selectedNode.email}`}
                    className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {selectedNode.email}
                  </a>
                )}
                {selectedNode.phone && (
                  <a 
                    href={`tel:${selectedNode.phone}`}
                    className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {selectedNode.phone}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FinancialLatticePage() {
  return (
    <DashboardLayout hideHeader wide>
      <LabPageLayout>
        <FinancialLatticeContent />
      </LabPageLayout>
    </DashboardLayout>
  );
}
