import { NodeObject, LinkObject } from 'react-force-graph-2d';

export type NodeStatus = 'healthy' | 'warning' | 'critical';

export interface SatelliteNode {
  id: string;
  label: string;
  sublabel?: string;
  status: NodeStatus;
  value: number;
  maxValue: number;
  currentValue: number;
  type: 'satellite';
  metadata?: Record<string, unknown>;
}

export interface CoreNode {
  id: string;
  label: string;
  type: 'core';
}

export type GraphNode = (SatelliteNode | CoreNode) & NodeObject;

export interface GraphLink extends LinkObject {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface StatusColors {
  main: string;
  glow: string;
  bg: string;
  text: string;
}

export const DEFAULT_STATUS_COLORS: Record<NodeStatus, StatusColors> = {
  healthy: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', bg: 'bg-green-500', text: 'text-green-500' },
  warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  critical: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', bg: 'bg-red-500', text: 'text-red-500' },
};

export const DEFAULT_CORE_COLOR = { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' };
