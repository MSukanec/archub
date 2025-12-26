import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { hslToHex, hexToRgb, hexToHsl, formatHslForCss, calculateHoverColor, calculateForegroundColor } from "@/utils/colorUtils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useThemeStore } from "@/stores/themeStore";

type Props = {
  initialHue?: number | null;
  initialEnabled?: boolean;
  onChange: (params: { useCustom: boolean; hue: number | null; hex: string | null }) => void;
};

export function ProjectColorAdvanced({
  initialHue = null,
  initialEnabled = false,
  onChange
}: Props) {
  const { isDark } = useThemeStore();

  // State
  const [enabled, setEnabled] = useState(initialEnabled);
  const [hue, setHue] = useState<number>(initialHue ?? 180); // Default to cyan
  const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction

  // Calculate hex color from hue
  const hex = useMemo(() => hslToHex(hue), [hue]);

  // Apply preview to CSS variables when enabled
  useEffect(() => {
    if (!enabled) {
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
  }, [enabled, hex, isDark]);

  // Notify parent of changes (only after user interaction)
  useEffect(() => {
    if (!hasInteracted) return;

    onChange({
      useCustom: enabled,
      hue: enabled ? hue : null,
      hex: enabled ? hex : null
    });
  }, [enabled, hue, hex, onChange, hasInteracted]);

  // Handle checkbox toggle
  const handleToggle = (checked: boolean) => {
    setHasInteracted(true);
    setEnabled(checked);
  };

  // Handle slider change
  const handleHueChange = (value: number) => {
    if (!enabled) return;
    setHasInteracted(true);
    setHue(value);
  };

  return (
    <div className="rounded-xl border border-border p-4 mt-4 bg-card">
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
              className="w-4 h-4 accent-accent cursor-pointer"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              data-testid="custom-color-toggle"
            />
            <span className="text-xs text-muted-foreground">
              Activar
            </span>
          </label>
        </div>

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
              disabled={!enabled}
              className="flex-1 h-3 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                [&::-webkit-slider-track]:h-3
                [&::-webkit-slider-track]:rounded-full
                [&::-webkit-slider-track]:bg-gradient-to-r
                [&::-webkit-slider-track]:from-[hsl(0,100%,40%)]
                [&::-webkit-slider-track]:via-[hsl(120,100%,35%)]
                [&::-webkit-slider-track]:to-[hsl(0,100%,40%)]
                [&::-webkit-slider-track]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-[20px]
                [&::-webkit-slider-thumb]:h-[20px]
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.25)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-track]:h-3
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:bg-gradient-to-r
                [&::-moz-range-track]:from-[hsl(0,100%,40%)]
                [&::-moz-range-track]:via-[hsl(120,100%,35%)]
                [&::-moz-range-track]:to-[hsl(0,100%,40%)]
                [&::-moz-range-track]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]
                [&::-moz-range-thumb]:w-[20px]
                [&::-moz-range-thumb]:h-[20px]
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.25)]
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
          {enabled && (
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
