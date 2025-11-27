import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, AlertTriangle, Clock, DollarSign } from 'lucide-react';

type ClientStatus = 'healthy' | 'warning' | 'critical';

interface ClientNode {
  id: string;
  name: string;
  unitNumber: string;
  status: ClientStatus;
  debtAmount: number;
  lastInteraction: Date;
  type: 'client';
}

interface CoreNode {
  id: string;
  name: string;
  type: 'core';
}

type GraphNode = (ClientNode | CoreNode) & NodeObject;

interface GraphLink extends LinkObject {
  source: string;
  target: string;
}

const STATUS_COLORS: Record<ClientStatus, { main: string; glow: string }> = {
  healthy: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
  warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
  critical: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
};

const CORE_COLOR = { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' };

function generateMockClients(count: number): ClientNode[] {
  const firstNames = ['Carlos', 'María', 'Juan', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofía', 'Miguel', 'Valentina', 'Andrés', 'Camila', 'Roberto', 'Lucía', 'Fernando'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz'];
  
  const clients: ClientNode[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const statusRoll = Math.random();
    let status: ClientStatus;
    let debtAmount: number;
    
    if (statusRoll < 0.15) {
      status = 'critical';
      debtAmount = 50000 + Math.random() * 150000;
    } else if (statusRoll < 0.35) {
      status = 'warning';
      debtAmount = 10000 + Math.random() * 40000;
    } else {
      status = 'healthy';
      debtAmount = Math.random() * 5000;
    }
    
    const daysAgo = status === 'critical' 
      ? 30 + Math.floor(Math.random() * 60) 
      : status === 'warning' 
        ? 7 + Math.floor(Math.random() * 23) 
        : Math.floor(Math.random() * 7);
    
    clients.push({
      id: `client-${i}`,
      name: `${firstName} ${lastName}`,
      unitNumber: `${String.fromCharCode(65 + Math.floor(i / 10))}-${(i % 10) + 1}${String(Math.floor(Math.random() * 10))}`,
      status,
      debtAmount,
      lastInteraction: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      type: 'client',
    });
  }
  
  return clients;
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

export default function FinancialLatticePage() {
  const graphRef = useRef<ForceGraphMethods | undefined>();
  const [selectedNode, setSelectedNode] = useState<ClientNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const animationFrameRef = useRef<number>(0);
  
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
  
  const mockClients = useMemo(() => generateMockClients(70), []);
  
  const graphData = useMemo(() => {
    const coreNode: CoreNode & NodeObject = {
      id: 'core',
      name: 'Proyecto Central',
      type: 'core',
      fx: 0,
      fy: 0,
    };
    
    const nodes: GraphNode[] = [coreNode, ...mockClients];
    
    const links: GraphLink[] = mockClients.map(client => ({
      source: 'core',
      target: client.id,
    }));
    
    return { nodes, links };
  }, [mockClients]);
  
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
  
  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
    
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 800);
      graphRef.current.zoom(1, 800);
    }
  }, []);
  
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
      ctx.font = `bold ${12 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CORE', x, y);
      
    } else {
      const clientNode = graphNode as ClientNode;
      const colors = STATUS_COLORS[clientNode.status];
      
      const baseSize = 8 + (clientNode.debtAmount / 200000) * 12;
      
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
        ctx.fillText(clientNode.unitNumber, x, y + size + 4);
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
  
  const d3Force = useCallback((forceName: string) => {
    if (forceName === 'charge') {
      return {
        strength: (node: NodeObject) => {
          const graphNode = node as GraphNode;
          if (graphNode.type === 'core') return -500;
          const clientNode = graphNode as ClientNode;
          if (clientNode.status === 'critical') return -80;
          if (clientNode.status === 'warning') return -60;
          return -40;
        },
      };
    }
    if (forceName === 'link') {
      return {
        distance: (link: LinkObject) => {
          const target = link.target as GraphNode;
          if (!target || target.type === 'core') return 150;
          const clientNode = target as ClientNode;
          if (clientNode.status === 'critical') return 100;
          if (clientNode.status === 'warning') return 180;
          return 280;
        },
      };
    }
    return null;
  }, []);
  
  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);
  
  const onEngineStop = useCallback(() => {
    animate();
  }, [animate]);
  
  const stats = useMemo(() => {
    const critical = mockClients.filter(c => c.status === 'critical');
    const warning = mockClients.filter(c => c.status === 'warning');
    const healthy = mockClients.filter(c => c.status === 'healthy');
    const totalDebt = mockClients.reduce((sum, c) => sum + c.debtAmount, 0);
    
    return { critical: critical.length, warning: warning.length, healthy: healthy.length, totalDebt };
  }, [mockClients]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4">
          <h1 className="text-xl font-bold text-white mb-1">Financial Neural Lattice</h1>
          <p className="text-sm text-white/50">Visualización orgánica del estado financiero</p>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-4 space-y-3">
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
          <div className="border-t border-white/10 pt-3 mt-3">
            <span className="text-xs text-white/50">Deuda Total</span>
            <p className="text-lg font-semibold text-white">{formatCurrency(stats.totalDebt)}</p>
          </div>
        </div>
      </div>
      
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodeRelSize={15}
        onNodeClick={handleNodeClick}
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
                      <p className="text-white/50 mt-1">Unidad {selectedNode.unitNumber}</p>
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
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${STATUS_COLORS[selectedNode.status].main}20` }}>
                        <DollarSign className="w-6 h-6" style={{ color: STATUS_COLORS[selectedNode.status].main }} />
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Deuda Pendiente</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(selectedNode.debtAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-3 rounded-lg bg-white/10">
                        <Clock className="w-6 h-6 text-white/70" />
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Última Interacción</p>
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
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                      data-testid="button-call-client"
                    >
                      <Phone className="w-4 h-4" />
                      Llamar
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-colors"
                      style={{ 
                        backgroundColor: STATUS_COLORS[selectedNode.status].main,
                      }}
                      data-testid="button-email-client"
                    >
                      <Mail className="w-4 h-4" />
                      Contactar
                    </button>
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
            Click en un nodo para ver detalles • Arrastra para mover • Scroll para zoom
          </p>
        </div>
      </div>
    </div>
  );
}
