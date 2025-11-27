import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, AlertTriangle, Clock, DollarSign, Building2, FolderOpen, Users, Loader2, Network, Grid3X3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getProjectsLite } from '@/features/projects/services/getProjectsLite';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type ClientStatus = 'healthy' | 'warning' | 'critical';
type ViewMode = 'network' | 'heatmap';

interface ClientNode {
  id: string;
  name: string;
  unitNumber: string;
  status: ClientStatus;
  debtAmount: number;
  totalCommitted: number;
  totalPaid: number;
  lastInteraction: Date;
  type: 'client';
  email?: string;
  phone?: string;
}

interface CoreNode {
  id: string;
  name: string;
  type: 'core';
  projectName?: string;
}

type GraphNode = (ClientNode | CoreNode) & NodeObject;

interface GraphLink extends LinkObject {
  source: string;
  target: string;
}

const STATUS_COLORS: Record<ClientStatus, { main: string; glow: string; bg: string; text: string }> = {
  healthy: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', bg: 'bg-green-500', text: 'text-green-500' },
  warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  critical: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', bg: 'bg-red-500', text: 'text-red-500' },
};

const CORE_COLOR = { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' };

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

function determineClientStatus(balanceDue: number, totalCommitted: number): ClientStatus {
  if (totalCommitted === 0) return 'healthy';
  const percentOwed = (balanceDue / totalCommitted) * 100;
  
  if (balanceDue <= 0 || percentOwed < 5) return 'healthy';
  if (percentOwed < 30) return 'warning';
  return 'critical';
}

interface ClientSummaryData {
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
}

interface ClientsSummaryResponse {
  plan: { slug: string; isMultiCurrency: boolean };
  clients: ClientSummaryData[];
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

interface HeatmapViewProps {
  clients: ClientNode[];
  onClientClick: (client: ClientNode) => void;
}

function HeatmapView({ clients, onClientClick }: HeatmapViewProps) {
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const statusOrder = { critical: 0, warning: 1, healthy: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.debtAmount - a.debtAmount;
    });
  }, [clients]);

  return (
    <div className="absolute inset-0 overflow-auto p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedClients.map((client) => {
            const paymentPercent = client.totalCommitted > 0 
              ? Math.round((client.totalPaid / client.totalCommitted) * 100) 
              : 100;
            
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => onClientClick(client)}
                className={cn(
                  "relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border",
                  client.status === 'critical' && "bg-red-500/20 border-red-500/50 hover:bg-red-500/30",
                  client.status === 'warning' && "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30",
                  client.status === 'healthy' && "bg-green-500/20 border-green-500/50 hover:bg-green-500/30",
                )}
                data-testid={`heatmap-client-${client.id}`}
              >
                {client.status === 'critical' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white truncate" title={client.name}>
                    {client.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-white/50">{client.unitNumber}</p>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Pagado</span>
                      <span className={STATUS_COLORS[client.status].text}>{paymentPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${paymentPercent}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn(
                          "h-full rounded-full",
                          client.status === 'critical' && "bg-red-500",
                          client.status === 'warning' && "bg-yellow-500",
                          client.status === 'healthy' && "bg-green-500",
                        )}
                      />
                    </div>
                  </div>
                  
                  {client.debtAmount > 0 && (
                    <p className="text-xs text-white/70 mt-2">
                      Debe: {formatCurrency(client.debtAmount)}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {clients.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Grid3X3 className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/50">No hay clientes para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface NetworkViewProps {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  clientNodes: ClientNode[];
  dimensions: { width: number; height: number };
  onNodeClick: (node: NodeObject) => void;
  graphRef: React.MutableRefObject<ForceGraphMethods | undefined>;
  onEngineStop: () => void;
}

function NetworkView({ graphData, dimensions, onNodeClick, graphRef, onEngineStop }: NetworkViewProps) {
  const nodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const graphNode = node as GraphNode;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    
    if (graphNode.type === 'core') {
      const baseSize = 35;
      const pulseIntensity = 0.15;
      const pulseSpeed = 0.002;
      const pulse = 1 + Math.sin(Date.now() * pulseSpeed) * pulseIntensity;
      const size = baseSize * pulse;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, CORE_COLOR.glow);
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = CORE_COLOR.main;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${10 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const coreLabel = graphNode.projectName ? graphNode.projectName.substring(0, 10) : 'CORE';
      ctx.fillText(coreLabel, x, y);
      
    } else {
      const clientNode = graphNode as ClientNode;
      const colors = STATUS_COLORS[clientNode.status];
      
      const maxDebt = 500000;
      const baseSize = 8 + (Math.min(clientNode.debtAmount, maxDebt) / maxDebt) * 12;
      
      let size = baseSize;
      if (clientNode.status === 'critical') {
        const pulseSpeed = 0.004;
        const pulseIntensity = 0.2;
        const pulse = 1 + Math.sin(Date.now() * pulseSpeed) * pulseIntensity;
        size = baseSize * pulse;
      }
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = colors.main;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.3, 0, 2 * Math.PI);
      ctx.fill();
      
      if (globalScale > 1.5) {
        ctx.fillStyle = '#fff';
        ctx.font = `${10 / globalScale}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const shortName = clientNode.name.split(' ')[0].substring(0, 8);
        ctx.fillText(shortName, x, y + size + 4);
      }
    }
  }, []);
  
  const linkCanvasObject = useCallback((link: LinkObject, ctx: CanvasRenderingContext2D) => {
    const source = link.source as NodeObject;
    const target = link.target as NodeObject;
    
    if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return;
    
    const targetNode = graphData.nodes.find(n => n.id === (typeof target === 'object' ? target.id : target));
    if (!targetNode || targetNode.type === 'core') return;
    
    const clientNode = targetNode as ClientNode;
    const colors = STATUS_COLORS[clientNode.status];
    
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, colors.glow);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = clientNode.status === 'critical' ? 1.5 : 0.5;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }, [graphData.nodes]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeCanvasObject={nodeCanvasObject}
      linkCanvasObject={linkCanvasObject}
      nodeRelSize={15}
      onNodeClick={onNodeClick}
      backgroundColor="#0a0a0f"
      width={dimensions.width}
      height={dimensions.height}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      warmupTicks={100}
      cooldownTicks={0}
      onEngineStop={onEngineStop}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      minZoom={0.3}
      maxZoom={8}
    />
  );
}

export default function FinancialLatticePage() {
  const graphRef = useRef<ForceGraphMethods | undefined>();
  const [selectedNode, setSelectedNode] = useState<ClientNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const animationFrameRef = useRef<number>(0);
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const organizations = userData?.organizations || [];
  
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['lattice-projects', selectedOrgId],
    queryFn: () => getProjectsLite(selectedOrgId!),
    enabled: !!selectedOrgId,
    staleTime: 0,
  });
  
  const { data: clientsSummary, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-summary-lattice', selectedProjectId, selectedOrgId],
    queryFn: () => fetchClientsSummary(selectedProjectId!, selectedOrgId!),
    enabled: !!selectedProjectId && !!selectedOrgId,
  });
  
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);
  
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  useEffect(() => {
    setSelectedProjectId(null);
  }, [selectedOrgId]);
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const clientNodes: ClientNode[] = useMemo(() => {
    if (!clientsSummary?.clients) return [];
    
    return clientsSummary.clients.map((client, index) => {
      const lastPaymentDate = client.financialByCurrency?.[0]?.last_payment_date;
      
      return {
        id: `client-${client.id}`,
        name: client.contacts?.full_name || 'Sin nombre',
        unitNumber: `C-${String(index + 1).padStart(2, '0')}`,
        status: determineClientStatus(client.balance_due, client.total_committed_amount),
        debtAmount: Math.max(0, client.balance_due),
        totalCommitted: client.total_committed_amount,
        totalPaid: client.total_paid_amount,
        lastInteraction: lastPaymentDate ? new Date(lastPaymentDate) : new Date(),
        type: 'client' as const,
        email: client.contacts?.email,
        phone: client.contacts?.phone,
      };
    });
  }, [clientsSummary]);
  
  const graphData = useMemo(() => {
    const coreNode: CoreNode & NodeObject = {
      id: 'core',
      name: 'Proyecto Central',
      projectName: selectedProject?.name,
      type: 'core',
      fx: 0,
      fy: 0,
    };
    
    const nodes: GraphNode[] = [coreNode, ...clientNodes];
    
    const links: GraphLink[] = clientNodes.map(client => ({
      source: 'core',
      target: client.id,
    }));
    
    return { nodes, links };
  }, [clientNodes, selectedProject]);
  
  const handleNodeClick = useCallback((node: NodeObject) => {
    const graphNode = node as GraphNode;
    if (graphNode.type === 'client') {
      setSelectedNode(graphNode as ClientNode);
      
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(3, 800);
      }
    }
  }, []);
  
  const handleClientClick = useCallback((client: ClientNode) => {
    setSelectedNode(client);
  }, []);
  
  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
    
    if (graphRef.current && viewMode === 'network') {
      graphRef.current.centerAt(0, 0, 800);
      graphRef.current.zoom(1, 800);
    }
  }, [viewMode]);
  
  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);
  
  const onEngineStop = useCallback(() => {
    animate();
  }, [animate]);
  
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

  const isLoading = userLoading || projectsLoading || clientsLoading;
  const hasNoClients = !isLoading && clientNodes.length === 0 && selectedProjectId;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/80 backdrop-blur-md rounded-full border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => setViewMode('network')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              viewMode === 'network' 
                ? "bg-blue-500 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"
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
                ? "bg-blue-500 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            data-testid="button-view-heatmap"
          >
            <Grid3X3 className="w-4 h-4" />
            Mapa de Calor
          </button>
        </div>
      </div>
      
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4">
          <h1 className="text-xl font-bold text-white mb-1">Financial Neural Lattice</h1>
          <p className="text-sm text-white/50">Visualización orgánica del estado financiero</p>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Building2 className="w-3 h-3" />
              <span>Organización</span>
            </div>
            <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white text-sm">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <FolderOpen className="w-3 h-3" />
              <span>Proyecto</span>
            </div>
            <Select 
              value={selectedProjectId || ''} 
              onValueChange={setSelectedProjectId}
              disabled={!selectedOrgId || projects.length === 0}
            >
              <SelectTrigger className="bg-white/5 border-white/20 text-white text-sm">
                <SelectValue placeholder={projectsLoading ? 'Cargando...' : 'Seleccionar...'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color || 'hsl(var(--accent))' }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Users className="w-3 h-3" />
            <span>Clientes: {stats.totalClients}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-white/80">Críticos: {stats.critical}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-white/80">Alerta: {stats.warning}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-white/80">Saludables: {stats.healthy}</span>
          </div>
          <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
            <div>
              <span className="text-xs text-white/50">Comprometido</span>
              <p className="text-sm font-medium text-white">{formatCurrency(stats.totalCommitted)}</p>
            </div>
            <div>
              <span className="text-xs text-white/50">Cobrado</span>
              <p className="text-sm font-medium text-green-400">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div>
              <span className="text-xs text-white/50">Por Cobrar</span>
              <p className="text-lg font-semibold text-white">{formatCurrency(stats.totalDebt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-white/70">Cargando datos...</p>
          </div>
        </div>
      )}
      
      {hasNoClients && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <Users className="w-16 h-16 text-white/30" />
            <p className="text-white/70 text-lg">No hay clientes en este proyecto</p>
            <p className="text-white/40 text-sm">Agrega clientes para ver la visualización</p>
          </div>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        {!isLoading && clientNodes.length > 0 && viewMode === 'network' && (
          <motion.div
            key="network"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <NetworkView
              graphData={graphData}
              clientNodes={clientNodes}
              dimensions={dimensions}
              onNodeClick={handleNodeClick}
              graphRef={graphRef}
              onEngineStop={onEngineStop}
            />
          </motion.div>
        )}
        
        {!isLoading && clientNodes.length > 0 && viewMode === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <HeatmapView
              clients={clientNodes}
              onClientClick={handleClientClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-20"
              onClick={handleCloseDetail}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[400px] max-w-[90vw]"
            >
              <div 
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${STATUS_COLORS[selectedNode.status].glow} 0%, rgba(10, 10, 15, 0.98) 50%)`,
                  borderColor: STATUS_COLORS[selectedNode.status].main,
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div 
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
                        style={{ 
                          backgroundColor: `${STATUS_COLORS[selectedNode.status].main}20`,
                          color: STATUS_COLORS[selectedNode.status].main,
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[selectedNode.status].main }}
                        />
                        {selectedNode.status === 'critical' ? 'Crítico' : selectedNode.status === 'warning' ? 'Alerta' : 'Saludable'}
                      </div>
                      <h2 className="text-2xl font-bold text-white">{selectedNode.name}</h2>
                      <p className="text-white/50 mt-1">{selectedNode.unitNumber}</p>
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      data-testid="button-close-detail"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50">Comprometido</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(selectedNode.totalCommitted)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50">Pagado</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(selectedNode.totalPaid)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${STATUS_COLORS[selectedNode.status].main}20` }}>
                        <DollarSign className="w-6 h-6" style={{ color: STATUS_COLORS[selectedNode.status].main }} />
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Saldo Pendiente</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(selectedNode.debtAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-3 rounded-lg bg-white/10">
                        <Clock className="w-6 h-6 text-white/70" />
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Último Pago</p>
                        <p className="text-lg font-medium text-white">
                          {formatDate(selectedNode.lastInteraction)}
                          <span className="text-sm text-white/40 ml-2">
                            (hace {getDaysSince(selectedNode.lastInteraction)} días)
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {selectedNode.status === 'critical' && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-400">Requiere atención inmediata</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    {selectedNode.phone && (
                      <a 
                        href={`tel:${selectedNode.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                        data-testid="button-call-client"
                      >
                        <Phone className="w-4 h-4" />
                        Llamar
                      </a>
                    )}
                    {selectedNode.email && (
                      <a 
                        href={`mailto:${selectedNode.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-colors"
                        style={{ 
                          backgroundColor: STATUS_COLORS[selectedNode.status].main,
                        }}
                        data-testid="button-email-client"
                      >
                        <Mail className="w-4 h-4" />
                        Contactar
                      </a>
                    )}
                    {!selectedNode.phone && !selectedNode.email && (
                      <div className="flex-1 text-center text-white/40 text-sm py-3">
                        Sin datos de contacto
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-4 py-2">
          <p className="text-xs text-white/50">
            {viewMode === 'network' 
              ? 'Click en un nodo para ver detalles • Arrastra para mover • Scroll para zoom'
              : 'Click en una celda para ver detalles del cliente'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
