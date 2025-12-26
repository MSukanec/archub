import { useCallback, useRef, useEffect, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { forceCollide } from 'd3-force';
import { 
  GraphData, 
  GraphNode, 
  SatelliteNode,
  CoreNode,
  getStatusColorsFromCSS,
  getCoreColorFromCSS,
  StatusColors 
} from './types';
import { NodeRenderer, SphereNodeRenderer } from './renderers';

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
  nodeRenderer?: NodeRenderer;
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
  nodeRenderer = SphereNodeRenderer,
}: NeuralNetworkGraphProps) {
  const internalRef = useRef<ForceGraphMethods | undefined>();
  const graphRef = externalRef || internalRef;
  const animationFrameRef = useRef<number>(0);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const resolvedStatusColors = useMemo(() => statusColors || getStatusColorsFromCSS(), [statusColors]);
  const resolvedCoreColor = useMemo(() => coreColor || getCoreColorFromCSS(), [coreColor]);
  
  const resolvedBgColor = useMemo(() => {
    if (backgroundColor) return backgroundColor;
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue('--content-bg').trim() || 'hsl(0, 0%, 95%)';
    }
    return 'hsl(0, 0%, 95%)';
  }, [backgroundColor]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      
      const chargeForce = fg.d3Force('charge');
      if (chargeForce) {
        (chargeForce as any).strength(-500);
        (chargeForce as any).distanceMax(600);
      }
      
      const linkForce = fg.d3Force('link');
      if (linkForce) {
        (linkForce as any).distance((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          if (sourceId === 'core') return 120;
          if (typeof sourceId === 'string' && sourceId.startsWith('type-')) return 100;
          return 80;
        });
        (linkForce as any).strength((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          if (sourceId === 'core') return 0.5;
          return 0.3;
        });
      }
      
      fg.d3Force('collision', forceCollide().radius(25).strength(0.8));
      
      fg.d3ReheatSimulation();
    }
  }, [data, graphRef]);

  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const onEngineStop = useCallback(() => {
    animate();
  }, [animate]);

  const nodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const graphNode = node as GraphNode;
    
    const rendererContext = {
      statusColors: resolvedStatusColors,
      coreColor: resolvedCoreColor,
      maxNodeValue,
      globalScale,
      imageCache: imageCacheRef.current,
    };
    
    if (graphNode.type === 'core') {
      nodeRenderer.renderCore(graphNode as CoreNode & NodeObject, ctx, rendererContext);
    } else {
      nodeRenderer.renderSatellite(graphNode as SatelliteNode & NodeObject, ctx, rendererContext);
    }
  }, [resolvedCoreColor, resolvedStatusColors, maxNodeValue, nodeRenderer]);
  
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
      nodeId="id"
      nodeRelSize={15}
      onNodeClick={handleNodeClick}
      backgroundColor={resolvedBgColor}
      width={width}
      height={height}
      d3AlphaDecay={0.015}
      d3VelocityDecay={0.25}
      warmupTicks={150}
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
