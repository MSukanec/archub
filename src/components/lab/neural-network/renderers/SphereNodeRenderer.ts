import { NodeObject } from 'react-force-graph-2d';
import { SatelliteNode, CoreNode } from '../types';
import { NodeRenderer, NodeRendererContext } from './types';

export const SphereNodeRenderer: NodeRenderer = {
  renderCore: (
    node: CoreNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { coreColor, globalScale } = context;

    const baseSize = 35;
    const pulseIntensity = 0.15;
    const pulseSpeed = 0.002;
    const pulse = 1 + Math.sin(Date.now() * pulseSpeed) * pulseIntensity;
    const size = baseSize * pulse;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, coreColor.glow);
    gradient.addColorStop(0.5, 'hsla(76, 100%, 40%, 0.2)');
    gradient.addColorStop(1, 'hsla(76, 100%, 40%, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = coreColor.main;
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

    const coreLabel = node.label.substring(0, 10);
    ctx.fillText(coreLabel, x, y);
  },

  renderSatellite: (
    node: SatelliteNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { statusColors, maxNodeValue, globalScale } = context;

    const colors = statusColors[node.status] || statusColors.healthy;

    const baseSize = 8 + (Math.min(node.value, maxNodeValue) / maxNodeValue) * 12;

    let size = baseSize;
    if (node.status === 'critical') {
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
      ctx.fillStyle = '#333';
      ctx.font = `${10 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const shortLabel = node.label.split(' ')[0].substring(0, 8);
      ctx.fillText(shortLabel, x, y + size + 4);
    }
  },
};
