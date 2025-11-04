import { useEffect, useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import chroma from "chroma-js";
import { hslToHex, hexToRgb, hexToHsl, formatHslForCss, calculateHoverColor, calculateForegroundColor } from "@/utils/colorUtils";
import { isProOrTeams } from "@/utils/planHelpers";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useThemeStore } from "@/stores/themeStore";

type Props = {
  initialHue?: number | null;
  initialEnabled?: boolean;
  onChange: (params: { useCustom: boolean; hue: number | null; hex: string | null }) => void;
};

export default function ProjectColorAdvanced({
  initialHue = null,
  initialEnabled = false,
  onChange
}: Props) {
  const { data: userData } = useCurrentUser();
  const { isDark } = useThemeStore();
  
  // Get current organization plan
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId
  );
  const planCode = currentOrganization?.plan?.name || 'free';
  const isPro = isProOrTeams(planCode);

  // State
  const [enabled, setEnabled] = useState(initialEnabled && isPro);
  const [hue, setHue] = useState<number>(initialHue ?? 180); // Default to cyan
  const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction

  // Calculate hex color from hue
  const hex = useMemo(() => hslToHex(hue), [hue]);

  // Apply preview to CSS variables when enabled
  useEffect(() => {
    if (!enabled || !isPro) {
      // Clear preview variables
      const root = document.documentElement;
      root.style.removeProperty('--accent-preview');
      root.style.removeProperty('--accent-preview-hsl');
      root.style.removeProperty('--accent-preview-rgb');
      root.style.removeProperty('--accent-preview-hover');
      root.style.removeProperty('--accent-preview-foreground');
      return;
    }

    // Apply preview variables
    const root = document.documentElement;
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);

    if (rgb && hsl) {
      const hslFormatted = formatHslForCss(hsl.h, hsl.s, hsl.l);
      const rgbFormatted = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
      const hoverColor = calculateHoverColor(hex, isDark);
      const foregroundColor = calculateForegroundColor(hex);

      root.style.setProperty('--accent-preview', `hsl(${hslFormatted})`);
      root.style.setProperty('--accent-preview-hsl', hslFormatted);
      root.style.setProperty('--accent-preview-rgb', rgbFormatted);
      root.style.setProperty('--accent-preview-hover', hoverColor);
      root.style.setProperty('--accent-preview-foreground', foregroundColor);
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--accent-preview');
      root.style.removeProperty('--accent-preview-hsl');
      root.style.removeProperty('--accent-preview-rgb');
      root.style.removeProperty('--accent-preview-hover');
      root.style.removeProperty('--accent-preview-foreground');
    };
  }, [enabled, isPro, hex, isDark]);

  // Notify parent of changes (only after user interaction)
  useEffect(() => {
    // Don't notify on mount to avoid overwriting existing values for non-PRO users
    if (!hasInteracted) return;

    const shouldUseCustom = enabled && isPro;
    onChange({
      useCustom: shouldUseCustom,
      hue: shouldUseCustom ? hue : null,
      hex: shouldUseCustom ? hex : null
    });
  }, [enabled, hue, isPro, hex, onChange, hasInteracted]);

  // Handle checkbox toggle
  const handleToggle = (checked: boolean) => {
    if (!isPro) return; // Prevent toggle if not PRO
    setHasInteracted(true);
    setEnabled(checked);
  };

  // Handle slider change
  const handleHueChange = (value: number) => {
    if (!isPro || !enabled) return;
    setHasInteracted(true);
    setHue(value);
  };

  return (
    <div className="relative rounded-xl border border-border p-4 mt-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <Label className="font-medium text-sm cursor-pointer">
            Color personalizado
          </Label>
        </div>
        
        {/* Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            checked={enabled && isPro}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={!isPro}
            data-testid="custom-color-toggle"
          />
          <span className="text-xs text-muted-foreground">
            {isPro ? "Activar" : "Requiere Pro"}
          </span>
        </label>
      </div>

      {/* Overlay for non-PRO users */}
      {!isPro && (
        <div className="absolute inset-0 bg-background/60 dark:bg-background/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Función disponible en planes Pro o Teams
            </span>
          </div>
        </div>
      )}

      {/* Slider and preview */}
      <div className="space-y-3">
        {/* Slider */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            disabled={!isPro || !enabled}
            className="flex-1 h-3 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
              [&::-webkit-slider-track]:h-3
              [&::-webkit-slider-track]:rounded-lg 
              [&::-webkit-slider-track]:bg-gradient-to-r 
              [&::-webkit-slider-track]:from-red-500
              [&::-webkit-slider-track]:via-green-500
              [&::-webkit-slider-track]:to-red-500
              [&::-webkit-slider-track]:shadow-sm
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-gray-400
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-track]:h-3
              [&::-moz-range-track]:rounded-lg
              [&::-moz-range-track]:bg-gradient-to-r
              [&::-moz-range-track]:from-red-500
              [&::-moz-range-track]:via-green-500
              [&::-moz-range-track]:to-red-500
              [&::-moz-range-track]:shadow-sm
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-gray-400
              [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:border-none"
            data-testid="hue-slider"
          />
          
          {/* Color preview circle */}
          <div
            className="w-12 h-12 rounded-full ring-2 ring-border shadow-sm shrink-0 transition-colors duration-150"
            style={{ backgroundColor: hex }}
            title={hex}
            data-testid="color-preview-circle"
          />
        </div>

        {/* Info text */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Tono: <span className="font-mono font-medium">{hue}°</span>
          </span>
          <span className="text-muted-foreground">
            Color: <span className="font-mono font-medium">{hex}</span>
          </span>
        </div>

        {/* Preview badge */}
        {enabled && isPro && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Vista previa:</span>
            <Badge
              style={{
                backgroundColor: hex,
                color: 'white'
              }}
              className="transition-colors duration-150"
              data-testid="preview-badge"
            >
              Color personalizado
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
