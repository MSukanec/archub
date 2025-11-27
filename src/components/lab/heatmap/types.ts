export type CellStatus = 'healthy' | 'warning' | 'critical';

export interface HeatmapCell {
  id: string;
  label: string;
  sublabel?: string;
  status: CellStatus;
  value: number;
  maxValue: number;
  currentValue: number;
  metadata?: Record<string, unknown>;
}

export interface StatusColors {
  main: string;
  glow: string;
  bg: string;
  text: string;
}

export const DEFAULT_STATUS_COLORS: Record<CellStatus, StatusColors> = {
  healthy: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', bg: 'bg-green-500', text: 'text-green-500' },
  warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  critical: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', bg: 'bg-red-500', text: 'text-red-500' },
};
