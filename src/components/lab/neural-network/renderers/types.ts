import { NodeObject } from 'react-force-graph-2d';
import { GraphNode, SatelliteNode, CoreNode, StatusColors } from '../types';

export interface NodeRendererContext {
  statusColors: Record<string, StatusColors>;
  coreColor: { main: string; glow: string };
  maxNodeValue: number;
  globalScale: number;
  imageCache?: Map<string, HTMLImageElement>;
}

export interface NodeRenderer {
  renderCore: (
    node: CoreNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => void;
  
  renderSatellite: (
    node: SatelliteNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => void;
}

export interface AvatarNodeData extends SatelliteNode {
  avatarUrl?: string;
  groupColor?: string;
  initials?: string;
}
