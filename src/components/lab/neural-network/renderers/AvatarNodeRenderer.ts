import { NodeObject } from 'react-force-graph-2d';
import { SatelliteNode, CoreNode } from '../types';
import { NodeRenderer, NodeRendererContext, AvatarNodeData } from './types';

const GROUP_COLORS: Record<string, string> = {
  'albañil': 'hsl(220, 70%, 50%)',
  'cliente': 'hsl(150, 70%, 45%)',
  'arquitecto': 'hsl(280, 70%, 50%)',
  'ingeniero': 'hsl(35, 90%, 55%)',
  'proveedor': 'hsl(0, 70%, 55%)',
  'electricista': 'hsl(45, 90%, 50%)',
  'plomero': 'hsl(190, 70%, 45%)',
  'pintor': 'hsl(320, 70%, 50%)',
  'carpintero': 'hsl(25, 80%, 45%)',
  'default': 'hsl(210, 15%, 50%)',
};

function getGroupColor(groupType?: string): string {
  if (!groupType) return GROUP_COLORS.default;
  const normalized = groupType.toLowerCase().trim();
  return GROUP_COLORS[normalized] || GROUP_COLORS.default;
}

function getInitials(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return label.substring(0, 2).toUpperCase();
}

export const AvatarNodeRenderer: NodeRenderer = {
  renderCore: (
    node: CoreNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { globalScale } = context;

    const size = 40;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'hsl(220, 15%, 25%)' : 'hsl(220, 15%, 85%)';
    const borderColor = isDark ? 'hsl(220, 15%, 40%)' : 'hsl(220, 15%, 70%)';

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.stroke();

    const textColor = isDark ? 'hsl(220, 15%, 90%)' : 'hsl(220, 15%, 20%)';
    ctx.fillStyle = textColor;
    ctx.font = `bold ${12 / globalScale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label.substring(0, 12), x, y);
  },

  renderSatellite: (
    node: SatelliteNode & NodeObject,
    ctx: CanvasRenderingContext2D,
    context: NodeRendererContext
  ) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const { globalScale, imageCache } = context;

    const avatarNode = node as AvatarNodeData & NodeObject;
    const size = 18;
    const groupType = avatarNode.metadata?.groupType as string | undefined;
    const avatarUrl = avatarNode.avatarUrl || (avatarNode.metadata?.avatarUrl as string | undefined);
    const groupColor = avatarNode.groupColor || getGroupColor(groupType);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.clip();

    let imageLoaded = false;
    if (avatarUrl && imageCache) {
      const cachedImage = imageCache.get(avatarUrl);
      if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
        ctx.drawImage(cachedImage, x - size, y - size, size * 2, size * 2);
        imageLoaded = true;
      } else if (!cachedImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = avatarUrl;
        imageCache.set(avatarUrl, img);
      }
    }

    if (!imageLoaded) {
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? 'hsl(220, 15%, 30%)' : 'hsl(220, 15%, 90%)';
      ctx.fillStyle = bgColor;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);

      const initials = avatarNode.initials || getInitials(node.label);
      ctx.fillStyle = groupColor;
      ctx.font = `bold ${size * 0.8}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, x, y);
    }

    ctx.restore();

    ctx.strokeStyle = groupColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.stroke();

    if (globalScale > 1.2) {
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? 'hsl(0, 0%, 85%)' : 'hsl(0, 0%, 25%)';
      ctx.fillStyle = textColor;
      ctx.font = `${10 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const shortLabel = node.label.split(' ')[0].substring(0, 10);
      ctx.fillText(shortLabel, x, y + size + 6);

      if (groupType) {
        ctx.fillStyle = groupColor;
        ctx.font = `${8 / globalScale}px Inter, system-ui, sans-serif`;
        ctx.fillText(groupType, x, y + size + 18);
      }
    }
  },
};
