import { useCallback, useRef, useEffect, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { 
  GraphData, 
  GraphNode, 
  SatelliteNode, 
  getStatusColorsFromCSS,
  getCoreColorFromCSS,
  StatusColors 
} from './types';

export interface NeuralNetworkGraphProps {
  data: GraphData;
  width: number;
  height: number;
  backgroundColor?: string;
  coreColor?: { main: string; glow: string };
  statusColors?: Record<string, StatusColors>;
  maxNodeValue?: number;
  onNodeClick?: (node: SatelliteNode) => void;
  onCoreClick?: () => void;
  graphRef?: React.MutableRefObject<ForceGraphMethods | undefined>;
}

export function NeuralNetworkGraph({
  data,
  width,
  height,
  backgroundColor,
  coreColor,
  statusColors,
  maxNodeValue = 500000,
  onNodeClick,
  onCoreClick,
  graphRef: externalRef,
}: NeuralNetworkGraphProps) {
  const internalRef = useRef<ForceGraphMethods | undefined>();
  const graphRef = externalRef || internalRef;
  const animationFrameRef = useRef<number>(0);

  const resolvedStatusColors = useMemo(() => statusColors || getStatusColorsFromCSS(), [statusColors]);
  const resolvedCoreColor = useMemo(() => coreColor || getCoreColorFromCSS(), [coreColor]);
  
  const resolvedBgColor = useMemo(() => {
    if (backgroundColor) return backgroundColor;
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue('--main-sidebar-bg').trim() || 'hsl(0, 0%, 10%)';
    }
    return 'hsl(0, 0%, 10%)';
  }, [backgroundColor]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const onEngineStop = useCallback(() => {
    animate();
  }, [animate]);

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
      gradient.addColorStop(0, resolvedCoreColor.glow);
      gradient.addColorStop(0.5, 'hsla(76, 100%, 40%, 0.2)');
      gradient.addColorStop(1, 'hsla(76, 100%, 40%, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = resolvedCoreColor.main;
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
      
      const coreLabel = graphNode.label.substring(0, 10);
      ctx.fillText(coreLabel, x, y);
      
    } else {
      const satelliteNode = graphNode as SatelliteNode;
      const colors = resolvedStatusColors[satelliteNode.status] || resolvedStatusColors.healthy;
      
      const baseSize = 8 + (Math.min(satelliteNode.value, maxNodeValue) / maxNodeValue) * 12;
      
      let size = baseSize;
      if (satelliteNode.status === 'critical') {
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
        const shortLabel = satelliteNode.label.split(' ')[0].substring(0, 8);
        ctx.fillText(shortLabel, x, y + size + 4);
      }
    }
  }, [resolvedCoreColor, resolvedStatusColors, maxNodeValue]);
  
  const linkCanvasObject = useCallback((link: LinkObject, ctx: CanvasRenderingContext2D) => {
    const source = link.source as NodeObject;
    const target = link.target as NodeObject;
    
    if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return;
    
    const targetNode = data.nodes.find(n => n.id === (typeof target === 'object' ? target.id : target));
    if (!targetNode || targetNode.type === 'core') return;
    
    const satelliteNode = targetNode as SatelliteNode;
    const colors = resolvedStatusColors[satelliteNode.status] || resolvedStatusColors.healthy;
    
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, 'hsla(76, 100%, 40%, 0.1)');
    gradient.addColorStop(1, colors.glow);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = satelliteNode.status === 'critical' ? 1.5 : 0.5;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }, [data.nodes, resolvedStatusColors]);

  const handleNodeClick = useCallback((node: NodeObject) => {
    const graphNode = node as GraphNode;
    if (graphNode.type === 'satellite') {
      onNodeClick?.(graphNode as SatelliteNode);
      
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(3, 800);
      }
    } else if (graphNode.type === 'core') {
      onCoreClick?.();
    }
  }, [onNodeClick, onCoreClick, graphRef]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={data}
      nodeCanvasObject={nodeCanvasObject}
      linkCanvasObject={linkCanvasObject}
      nodeRelSize={15}
      onNodeClick={handleNodeClick}
      backgroundColor={resolvedBgColor}
      width={width}
      height={height}
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
