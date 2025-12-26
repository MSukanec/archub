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

function hslToHsla(hsl: string, alpha: number): string {
  const match = hsl.match(/hsl\s*\(\s*(\d+)\s*,?\s*(\d+(?:\.\d+)?)%?\s*,?\s*(\d+(?:\.\d+)?)%?\s*\)/i);
  if (match) {
    return `hsla(${match[1]}, ${match[2]}%, ${match[3]}%, ${alpha})`;
  }
  return `rgba(128, 128, 128, ${alpha})`;
}

export function getStatusColorsFromCSS(): Record<NodeStatus, StatusColors> {
  if (typeof window === 'undefined') {
    return DEFAULT_STATUS_COLORS;
  }
  
  const root = getComputedStyle(document.documentElement);
  const destructive = root.getPropertyValue('--destructive').trim() || 'hsl(0, 84%, 60%)';
  const warning = root.getPropertyValue('--warning').trim() || 'hsl(45, 90%, 50%)';
  const success = root.getPropertyValue('--success').trim() || 'hsl(76, 100%, 40%)';
  
  return {
    healthy: { 
      main: success, 
      glow: hslToHsla(success, 0.4), 
      bg: 'bg-[var(--success)]', 
      text: 'text-[var(--success)]' 
    },
    warning: { 
      main: warning, 
      glow: hslToHsla(warning, 0.4), 
      bg: 'bg-[var(--warning)]', 
      text: 'text-[var(--warning)]' 
    },
    critical: { 
      main: destructive, 
      glow: hslToHsla(destructive, 0.5), 
      bg: 'bg-[var(--destructive)]', 
      text: 'text-[var(--destructive)]' 
    },
  };
}

export function getCoreColorFromCSS(): { main: string; glow: string } {
  if (typeof window === 'undefined') {
    return DEFAULT_CORE_COLOR;
  }
  
  const root = getComputedStyle(document.documentElement);
  const accent = root.getPropertyValue('--accent').trim() || 'hsl(76, 100%, 40%)';
  
  return {
    main: accent,
    glow: hslToHsla(accent, 0.6),
  };
}

export const DEFAULT_STATUS_COLORS: Record<NodeStatus, StatusColors> = {
  healthy: { main: 'hsl(76, 100%, 40%)', glow: 'hsla(76, 100%, 40%, 0.4)', bg: 'bg-[var(--success)]', text: 'text-[var(--success)]' },
  warning: { main: 'hsl(45, 90%, 50%)', glow: 'hsla(45, 90%, 50%, 0.4)', bg: 'bg-[var(--warning)]', text: 'text-[var(--warning)]' },
  critical: { main: 'hsl(0, 84%, 60%)', glow: 'hsla(0, 84%, 60%, 0.5)', bg: 'bg-[var(--destructive)]', text: 'text-[var(--destructive)]' },
};

export const DEFAULT_CORE_COLOR = { main: 'hsl(76, 100%, 40%)', glow: 'hsla(76, 100%, 40%, 0.6)' };
