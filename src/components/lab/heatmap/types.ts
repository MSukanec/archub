export type CellStatus = 'healthy'| 'warning'| 'critical';
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
  healthy: { main: 'hsl(76, 100%, 40%)', glow: 'hsla(76, 100%, 40%, 0.4)', bg: 'bg-[var(--success)]', text: 'text-[var(--success)]'},
  warning: { main: 'hsl(45, 90%, 50%)', glow: 'hsla(45, 90%, 50%, 0.4)', bg: 'bg-[var(--warning)]', text: 'text-[var(--warning)]'},
  critical: { main: 'hsl(0, 84%, 60%)', glow: 'hsla(0, 84%, 60%, 0.5)', bg: 'bg-[var(--destructive)]', text: 'text-[var(--destructive)]'},
};
